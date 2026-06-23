import setting from "../setting.js";
import { addReport, getReports, deleteReport } from "../lib/reportsDb.js";

export default {
    name: "report",
    aliases: ["bug", "keluhan"],
    category: "general",
    description: "Melaporkan bug, error, atau keluhan terkait bot kepada owner",
    usage: "!report <pesan laporan>",

    async handler({ message, sock, args, rawArgs, sender, pushname, isGroup, groupName, isOwner, prefix }) {
        if (args.length === 0) {
            return message.reply(`❌ Format salah.\nContoh: \`${prefix}report Bot tidak bisa memutar lagu di YouTube\``);
        }

        const cmdFlag = args[0].toLowerCase();

        // ── Owner Flags Management ─────────────────────────────────────
        if (["--list", "-l"].includes(cmdFlag)) {
            if (!isOwner) return message.reply("⚠️ Hanya Owner yang bisa menggunakan flag ini.");
            
            const reports = getReports("report");
            if (reports.length === 0) {
                return message.reply("✅ Belum ada laporan/bug yang masuk.");
            }

            let reply = `🐛 *DAFTAR LAPORAN / BUG* 🐛\n\nTotal: ${reports.length} laporan\n\n`;
            reports.forEach((rep) => {
                const date = new Date(rep.timestamp).toLocaleString("id-ID");
                reply += `╭───「 ID: ${rep.id} 」\n`;
                reply += `│ 👤 Dari: ${rep.pushname} (@${rep.sender.split("@")[0]})\n`;
                if (rep.isGroup) reply += `│ 🏢 Grup: ${rep.groupName}\n`;
                reply += `│ 📅 Waktu: ${date}\n`;
                reply += `│ 💬 Masalah:\n│ _${rep.text}_\n`;
                reply += `╰──────────────\n\n`;
            });
            reply += `_Gunakan \`${prefix}report --del <id>\` jika bug sudah diperbaiki._`;

            return message.reply(reply);
        }

        if (["--delete", "--del", "-d"].includes(cmdFlag)) {
            if (!isOwner) return message.reply("⚠️ Hanya Owner yang bisa menggunakan flag ini.");
            
            const id = parseInt(args[1], 10);
            if (isNaN(id)) {
                return message.reply(`❌ Masukkan ID laporan yang ingin dihapus.\nContoh: \`${prefix}report --del 1\``);
            }

            const success = deleteReport("report", id);
            if (success) {
                return message.reply(`✅ Laporan ID ${id} berhasil dihapus.`);
            } else {
                return message.reply(`❌ Laporan dengan ID ${id} tidak ditemukan.`);
            }
        }

        // ── Normal User Usage (Submitting Report) ─────────────────────
        const text = rawArgs.trim();
        const newItem = addReport("report", sender, pushname, text, isGroup, groupName);

        // Notify Owners
        const ownerJids = setting.owner.map(num => num.includes("@s.whatsapp.net") ? num : num + "@s.whatsapp.net");
        
        let notificationMsg = `🚨 *LAPORAN BUG BARU!* (ID: ${newItem.id})\n\n`;
        notificationMsg += `👤 *Pelapor:* ${pushname} (@${sender.split("@")[0]})\n`;
        if (isGroup) notificationMsg += `🏢 *Grup:* ${groupName}\n`;
        notificationMsg += `\n💬 *Detail Error:*\n_${text}_\n\n`;
        notificationMsg += `_Gunakan \`${prefix}report --del ${newItem.id}\` jika sudah diselesaikan._`;

        let notifyCount = 0;
        for (const ownerJid of ownerJids) {
            try {
                await sock.sendMessage(ownerJid, { text: notificationMsg, mentions: [sender] });
                notifyCount++;
            } catch (err) {
                console.error(`[REPORT] Failed to notify owner ${ownerJid}`, err.message);
            }
        }

        if (notifyCount > 0) {
            return message.reply("✅ Laporan telah diterima! Terima kasih telah memberitahu kami, Owner akan segera mengeceknya.");
        } else {
            return message.reply("✅ Laporan kamu telah dicatat, tetapi saat ini Owner tidak dapat dihubungi.");
        }
    }
};
