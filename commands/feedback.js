import setting from "../setting.js";
import { addReport, getReports, deleteReport, markAsReplied } from "../lib/reportsDb.js";

export default {
    name: "feedback",
    aliases: ["saran"],
    category: "general",
    description: "Mengirimkan saran atau ide fitur kepada owner bot",
    usage: "!feedback <pesan saran>",

    async handler({ message, sock, args, rawArgs, sender, pushname, isGroup, groupName, isOwner, prefix }) {
        if (args.length === 0) {
            return message.reply(`❌ Format salah.\nContoh: \`${prefix}feedback Tolong tambahkan fitur main tebak-tebakan\``);
        }

        const cmdFlag = args[0].toLowerCase();

        // ── Owner Flags Management ─────────────────────────────────────
        if (["--list", "-l"].includes(cmdFlag)) {
            if (!isOwner) return message.reply("⚠️ Hanya Owner yang bisa menggunakan flag ini.");
            
            const feedbacks = getReports("feedback");
            if (feedbacks.length === 0) {
                return message.reply("✅ Belum ada feedback yang masuk.");
            }

            let reply = `📝 *DAFTAR FEEDBACK / SARAN* 📝\n\nTotal: ${feedbacks.length} saran\n\n`;
            feedbacks.forEach((fb) => {
                const date = new Date(fb.timestamp).toLocaleString("id-ID");
                reply += `╭───「 ID: ${fb.id} 」\n`;
                reply += `│ 👤 Dari: ${fb.pushname} (@${fb.sender.split("@")[0]})\n`;
                if (fb.isGroup) reply += `│ 🏢 Grup: ${fb.groupName}\n`;
                reply += `│ 📅 Waktu: ${date}\n`;
                reply += `│ 💬 Pesan:\n│ _${fb.text}_\n`;
                if (fb.replied) reply += `│ ✅ *[Telah Dibalas]*\n`;
                reply += `╰──────────────\n\n`;
            });
            reply += `_Gunakan \`${prefix}feedback --del <id>\` untuk menghapus._\n`;
            reply += `_Gunakan \`${prefix}feedback --reply <id> <pesan>\` untuk membalas._`;

            return message.reply(reply);
        }

        if (["--delete", "--del", "-d"].includes(cmdFlag)) {
            if (!isOwner) return message.reply("⚠️ Hanya Owner yang bisa menggunakan flag ini.");
            
            const id = parseInt(args[1], 10);
            if (isNaN(id)) {
                return message.reply(`❌ Masukkan ID feedback yang ingin dihapus.\nContoh: \`${prefix}feedback --del 1\``);
            }

            const success = deleteReport("feedback", id);
            if (success) {
                return message.reply(`✅ Feedback ID ${id} berhasil dihapus.`);
            } else {
                return message.reply(`❌ Feedback dengan ID ${id} tidak ditemukan.`);
            }
        }

        if (["--reply", "-r"].includes(cmdFlag)) {
            if (!isOwner) return message.reply("⚠️ Hanya Owner yang bisa menggunakan flag ini.");
            
            const id = parseInt(args[1], 10);
            const replyMsg = args.slice(2).join(" ");
            if (isNaN(id) || !replyMsg) {
                return message.reply(`❌ Format salah.\nContoh: \`${prefix}feedback --reply 1 Oke, saran diterima\``);
            }

            const item = getReports("feedback").find(r => r.id === id);
            if (!item) {
                return message.reply(`❌ Feedback dengan ID ${id} tidak ditemukan.`);
            }

            const replyText = `📩 *Balasan dari Owner (Feedback ID ${id})*\n\n"${replyMsg}"\n\n_Pesan aslimu:_\n_${item.text}_`;

            try {
                // Skenario 1: Reply langsung ke pesan aslinya di chat aslinya
                await sock.sendMessage(
                    item.chatId,
                    { text: replyText, mentions: [item.sender] },
                    { quoted: { key: item.messageKey, message: { conversation: item.text } } }
                );
                
                markAsReplied("feedback", id);
                return message.reply(`✅ Balasan berhasil dikirim ke @${item.sender.split("@")[0]} di obrolan aslinya.`);
            } catch (err) {
                // Fallback 1: Gagal membalas pesan (mungkin karena sudah sangat lama). Coba kirim biasa tanpa quoted
                try {
                    await sock.sendMessage(
                        item.chatId,
                        { text: replyText, mentions: [item.sender] }
                    );
                    markAsReplied("feedback", id);
                    return message.reply(`✅ Balasan dikirim ke grup/obrolan tanpa me-reply pesan asli karena pesan asli tidak dapat diakses.`);
                } catch (err2) {
                    // Fallback 2: Gagal kirim ke grup (bot di kick, dll). Coba DM langsung user-nya.
                    try {
                        await sock.sendMessage(
                            item.sender,
                            { text: `(Pesan dialihkan via Private Message karena grup asal tidak bisa diakses)\n\n` + replyText }
                        );
                        markAsReplied("feedback", id);
                        return message.reply(`✅ Balasan dikirim via Private Message karena obrolan asal tidak bisa diakses.`);
                    } catch (err3) {
                        return message.reply(`❌ Gagal mengirim balasan ke user tersebut sama sekali.`);
                    }
                }
            }
        }

        // ── Normal User Usage (Submitting Feedback) ─────────────────────
        const text = rawArgs.trim();
        const newItem = addReport("feedback", sender, pushname, text, isGroup, groupName, message.chat, message.key);

        // Notify Owners
        const ownerJids = setting.owner.map(num => num.includes("@s.whatsapp.net") ? num : num + "@s.whatsapp.net");
        
        let notificationMsg = `💡 *FEEDBACK BARU MASUK!* (ID: ${newItem.id})\n\n`;
        notificationMsg += `👤 *Pengirim:* ${pushname} (@${sender.split("@")[0]})\n`;
        if (isGroup) notificationMsg += `🏢 *Grup:* ${groupName}\n`;
        notificationMsg += `\n💬 *Saran:*\n_${text}_\n\n`;
        notificationMsg += `_Gunakan \`${prefix}feedback --del ${newItem.id}\` jika sudah dibaca._`;

        let notifyCount = 0;
        for (const ownerJid of ownerJids) {
            try {
                await sock.sendMessage(ownerJid, { text: notificationMsg, mentions: [sender] });
                notifyCount++;
            } catch (err) {
                console.error(`[FEEDBACK] Failed to notify owner ${ownerJid}`, err.message);
            }
        }

        if (notifyCount > 0) {
            return message.reply("✅ Terima kasih! Saran kamu sudah dikirim langsung ke Owner bot.");
        } else {
            return message.reply("✅ Saran kamu telah dicatat, tetapi saat ini Owner tidak dapat dihubungi.");
        }
    }
};
