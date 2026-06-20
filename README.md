# 🤖 Simple WhatsApp Bot

A fast, modular, and lightweight WhatsApp bot built with Node.js and the powerful [`@whiskeysockets/baileys`](https://github.com/WhiskeySockets/Baileys) library. This project is intended for personal use, providing a robust base to build custom WhatsApp automation while remaining open-source for others to clone and explore.

## ✨ Features

This bot is built with a modular command architecture, making it easy to add or remove features. Current built-in commands include:

*   **📱 Core**
    *   `menu` (`help`, `list`): Displays all available bot commands dynamically.
    *   `ping`: Checks bot response time and server status.
    *   `say`: Makes the bot repeat your message.
*   **🎨 Media & Creation**
    *   `sticker` (`s`, `stiker`): Converts images/videos into WhatsApp stickers.
    *   `toimg` (`ti`): Converts static stickers back into images.
*   **📥 Downloader**
    *   `ytdl` / `ytdlf`: Robust YouTube and general media downloading via `yt-dlp` integration (supports formats and queues).
    *   `danbooru`: Fetches high-quality images from Danbooru via tags and direct links.
*   **⚙️ Utility**
    *   `resend`: Extracts and resends "View Once" media or messages.
    *   `tag`: Mentions or tags members in a group.

## 🛠️ Tech Stack & Requirements

*   **Runtime:** Node.js (v16+ recommended)
*   **Library:** `@whiskeysockets/baileys`
*   **Key Dependencies:** `axios`, `wa-sticker-formatter`
*   **External Requirements:** 
    *   [FFmpeg](https://ffmpeg.org/) (Required for sticker creation and media conversion)
    *   [yt-dlp](https://github.com/yt-dlp/yt-dlp) (Required for downloading media via `ytdl` commands)

## 🚀 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd simple-whatsapp-bot
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Install System Dependencies (Important):**
   Make sure you have `ffmpeg` and `yt-dlp` installed and added to your system's PATH.

4. **Start the bot:**
   ```bash
   npm start
   ```

5. **Link to WhatsApp:**
   Upon running the bot for the first time, a QR code will be generated in the terminal. Open WhatsApp on your phone, go to **Linked Devices**, and scan the QR code. The session will be saved in the `session/` folder for subsequent logins.

## 📂 Project Structure

```text
simple-whatsapp-bot/
├── commands/       # Modular command files (each handles a specific feature)
│   ├── _registry.js# Dynamic command loader
│   └── ...         # Command files (.js)
├── lib/            # Core library, message wrappers, and utilities
├── services/       # External API services or specific heavy logic
├── session/        # WhatsApp authentication session data (Auto-generated)
├── temp/           # Temporary folder for media processing (Auto-generated)
├── index.js        # Main application entry point
├── handler.js      # Global message interception and routing logic
├── setting.js      # Global configuration (Owner number, prefixes, limits)
└── package.json    # Project metadata and dependencies
```

## 🧑‍💻 Creating New Commands

Adding a new command is as simple as creating a new `.js` file inside the `commands/` directory. The bot uses an auto-loader (`_registry.js`) to register commands on startup.

**Example `commands/hello.js`:**
```javascript
export default {
    name: "hello",
    aliases: ["hi", "greet"],
    description: "Sends a greeting message",
    async handler({ message }) {
        await message.reply("Hello there! 👋");
    }
};
```

## ⚙️ Configuration
You can edit the `setting.js` file to change bot prefixes, owner number, bot name, and temporary file configurations (like download size limits and intervals).

```javascript
// setting.js
const setting = {
    name: "Tederby18",
    owner: "6285157729639",
    prefixes: ["!", ".", "#", "/", "-"],
    // ...other configurations (ytdlp settings, max file sizes, etc.)
};
```

## 📝 License
This project is open-sourced under the [MIT License](LICENSE).
