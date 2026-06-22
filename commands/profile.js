import { jidNormalizedUser } from "baileys";

export default {
    name: "profile",
    aliases: ["pfp", "profil"],
    category: "general",
    description: "Melihat profil, nama, dan PFP pengguna (diri sendiri, yang di-quote, atau yang di-mention).",
    usage: "!profile [@user/reply]",

    async handler({ message, sock, sender, pushname }) {
        try {
            console.log("=========================================");
            console.log("[DEBUG-PROFILE] Memulai eksekusi perintah profile");
            console.log(`[DEBUG-PROFILE] Original Sender: ${sender}, Pushname: ${pushname}`);
            
            let target = null;
            let targetName = "Tidak diketahui";

            // Prioritas 1: Mention
            if (message.mentionedJid && message.mentionedJid.length > 0) {
                target = message.mentionedJid[0];
                console.log("[DEBUG-PROFILE] Target diatur dari mention:", target);
            } 
            // Prioritas 2: Quoted Message
            else if (message.quoted) {
                target = message.quoted.sender || message.quoted.participant;
                console.log("[DEBUG-PROFILE] Target diatur dari quoted message:", target);
            } 
            // Prioritas 3: Diri Sendiri (Sender)
            else {
                target = sender;
                targetName = pushname || "Tidak diketahui";
                console.log("[DEBUG-PROFILE] Target diatur dari sender (diri sendiri):", target);
            }

            if (!target) {
                console.log("[DEBUG-PROFILE] Gagal menentukan target. Menghentikan perintah.");
                return message.reply("Gagal mendapatkan target pengguna. Pastikan tag atau reply pesan dengan benar.");
            }

            // Normalisasi JID (Hanya untuk keperluan display, LID dan s.whatsapp.net)
            const normalizedTarget = jidNormalizedUser(target);
            const isLid = target.includes('@lid');
            const targetBaseId = target.split(':')[0].split('@')[0];
            
            console.log(`[DEBUG-PROFILE] Normalized Target: ${normalizedTarget}`);
            console.log(`[DEBUG-PROFILE] Is LID Format?: ${isLid}`);
            console.log(`[DEBUG-PROFILE] Target Base ID: ${targetBaseId}`);

            // Jika target bukan sender, kita tidak memiliki pushname (karena kita tidak pakai memory store).
            // Kita akan gunakan base JID sebagai fallback nama agar UI tetap rapi.
            if (target !== sender) {
                targetName = `User (${targetBaseId})`;
            }

            let pfpUrl = null;
            
            try {
                // Mencoba mem-fetch URL foto profil dengan JID yang ditemukan.
                // Jika user menggunakan mode LID (privasi nomor baru WA), request dengan LID akan tetap jalan.
                console.log(`[DEBUG-PROFILE] Memanggil sock.profilePictureUrl untuk JID: ${target}`);
                pfpUrl = await sock.profilePictureUrl(target, 'image');
                console.log("[DEBUG-PROFILE] Berhasil mendapatkan PFP URL:", pfpUrl);
            } catch (err) {
                console.log("[DEBUG-PROFILE] Gagal mendapatkan PFP URL pada percobaan pertama. Error:", err.message);
                
                // Fallback jika JID tidak berhasil (Misal nomor ada : / session device di dalamnya)
                if (target !== normalizedTarget) {
                    try {
                        console.log(`[DEBUG-PROFILE] Mencoba fallback dengan Normalized Target: ${normalizedTarget}`);
                        pfpUrl = await sock.profilePictureUrl(normalizedTarget, 'image');
                        console.log("[DEBUG-PROFILE] Berhasil mendapatkan PFP URL (Fallback):", pfpUrl);
                    } catch (fallbackErr) {
                         console.log("[DEBUG-PROFILE] Fallback juga gagal. Kemungkinan user privasi/tidak pakai PFP. Error:", fallbackErr.message);
                    }
                } else {
                    console.log("[DEBUG-PROFILE] Tidak mencoba fallback karena target sudah ternormalisasi.");
                }
            }

            // Membentuk caption balasan
            let caption = `*PROFILE INFO*\n\n`;
            caption += `👤 *Nama:* ${targetName}\n`;
            caption += `📌 *JID:* ${target}\n`;
            
            if (isLid) {
                caption += `\n_Catatan: Nomor disembunyikan oleh WhatsApp (Menggunakan ID Privat / LID)._\n`;
            }

            // Kirim pesan dengan atau tanpa gambar sesuai hasil fetching PFP
            if (pfpUrl) {
                console.log("[DEBUG-PROFILE] Mengirim pesan disertai gambar profil...");
                await sock.sendMessage(
                    message.chat,
                    { image: { url: pfpUrl }, caption: caption },
                    { quoted: message }
                );
            } else {
                console.log("[DEBUG-PROFILE] Mengirim pesan teks saja (tanpa PFP)...");
                caption += `\n_Gambar profil tidak ditemukan atau diprivasi._`;
                await sock.sendMessage(
                    message.chat,
                    { text: caption },
                    { quoted: message }
                );
            }

            console.log("[DEBUG-PROFILE] Perintah profile selesai dengan sukses.");
            console.log("=========================================");

        } catch (error) {
            console.error('[DEBUG-PROFILE] TERJADI KESALAHAN FATAL:', error);
            message.reply("Terjadi kesalahan sistem saat memproses profil. Cek log di terminal.");
        }
    }
};
