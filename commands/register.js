/**
 * Register — User registration command.
 *
 * Scalable design: stores basic metadata now, extensible via meta bag
 * for future features (XP, level, bio, etc.)
 */

import { registerUser, unregisterUser, isRegistered, getUser, saveUser } from "../lib/database.js";
import { registerReplyHandler, deleteReplyHandler } from "./_registry.js";

export default {
    name: "register",
    aliases: ["reg", "daftar", "registrasi"],
    category: "general",
    description: "Mendaftarkan diri ke database bot dan mengatur profil.",
    usage: "!register",

    async handler({ message, sender, pushname, prefix, sock }) {
        try {
            let user;
            let isNewUser = false;
            
            if (!isRegistered(sender)) {
                user = registerUser(sender, pushname);
                isNewUser = true;
            } else {
                user = getUser(sender);
            }

            const regDate = user.registeredAt
                ? new Date(user.registeredAt).toLocaleDateString("id-ID", {
                    day: "numeric", month: "long", year: "numeric",
                })
                : "Tidak diketahui";

            let caption = `╭━━━〔 📝 Registrasi 〕━━━\n`;
            if (isNewUser) {
                caption += `┃ ✅ *Registrasi Berhasil!*\n`;
                caption += `┃ Selamat datang di database bot.\n`;
            } else {
                caption += `┃ ℹ️ *Informasi Akun*\n`;
            }
            caption += `┣━━━━━━━━━━━━━━━━━━━━\n`;
            caption += `┃ 📛 Nama   : ${user.name || "Tidak diketahui"}\n`;
            caption += `┃ 📅 Tanggal: ${regDate}\n`;
            caption += `╰━━━━━━━━━━━━━━━━━━━━\n\n`;

            caption += `╭━━━〔 ⚙️ Menu Pengaturan 〕━━━\n`;
            caption += `┃ Balas pesan ini dengan:\n`;
            caption += `┃ ⋄ \`name <nama baru>\` untuk mengganti nama yang ter-register\n`;
            caption += `┃ ⋄ \`unreg\` untuk menghapus registrasi\n`;
            caption += `╰━━━━━━━━━━━━━━━━━━━━`;

            const sentMsg = await sock.sendMessage(message.chat, { text: caption }, { quoted: message });

            registerReplyHandler(sentMsg.key.id, replyHandler, {
                userId: sender,
                messageKey: sentMsg.key,
                commandName: "register"
            });

        } catch (error) {
            console.error("[REGISTER CMD]", error);
            message.reply("Terjadi kesalahan saat memproses registrasi.");
        }
    },
};

async function replyHandler({ message, sock, state }) {
    const text = message.text.trim();
    const args = text.split(" ");
    const cmd = args[0].toLowerCase();
    
    const { userId, messageKey } = state;

    if (cmd === "name") {
        const newName = args.slice(1).join(" ");
        if (!newName) {
            await message.reply("❌ Berikan nama baru yang ingin digunakan.\nContoh: `name Tederby`");
            return;
        }

        const user = getUser(userId);
        user.name = newName;
        saveUser(userId, user);

        deleteReplyHandler(messageKey.id);
        
        await sock.sendMessage(message.chat, { text: `>> *Changing name*`, edit: messageKey });
        await message.reply(`✅ Nama kamu berhasil diubah menjadi *${newName}*.`);
        return;
    }

    if (cmd === "unreg" || cmd === "unregister") {
        unregisterUser(userId);
        deleteReplyHandler(messageKey.id);
        
        await sock.sendMessage(message.chat, { text: `>> *Unregistering*`, edit: messageKey });
        await message.reply(`✅ Registrasi kamu telah dihapus dari database bot.`);
        return;
    }
}

