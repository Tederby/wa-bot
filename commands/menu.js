import { getAllCommands } from "./_registry.js";
import setting from "../setting.js";

export default {
    name: "menu",
    aliases: ["help", "list"],
    description: "Menampilkan semua daftar perintah bot",
    async handler({ message, prefix }) {
        const commands = getAllCommands();
        let menuText = `*👾 ${setting.name || "Bot Menu"} 👾*\n\n`;
        
        commands.forEach(cmd => {
            menuText += `*${prefix}${cmd.name}*\n`;
            if (cmd.aliases && cmd.aliases.length > 0) {
                menuText += `┣ ᴀʟɪᴀs: ${cmd.aliases.join(", ")}\n`;
            }
            if (cmd.description) {
                menuText += `┗ ᴅᴇsᴄ: ${cmd.description}\n\n`;
            } else {
                menuText += `┗ ᴅᴇsᴄ: -\n\n`;
            }
        });

        menuText += `*Powered by Baileys & Node.js*`;

        await message.reply(menuText.trim());
    }
};
