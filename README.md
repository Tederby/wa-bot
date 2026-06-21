# 🤖 Simple WhatsApp Bot

A fast, modular, and lightweight WhatsApp bot built with Node.js and the powerful [`@whiskeysockets/baileys`](https://github.com/WhiskeySockets/Baileys) library. 

This project uses a clean **middleware pipeline architecture**, automated command loading, and centralized configurations, making it highly scalable and easy to maintain. It is intended for personal use, providing a robust base to build custom WhatsApp automation while remaining open-source for others to clone and explore.

## ✨ Features

### 🧩 Modular Command System
Commands are automatically loaded and categorized. Current built-in categories include:

*   **📱 Core**
    *   `menu` (`help`, `list`): Displays all available bot commands dynamically, grouped by category.
    *   `ping`: Checks bot response time and server status.
    *   `say`: Makes the bot repeat your message.
*   **🎨 Media & Creation**
    *   `sticker` (`s`, `stiker`): Converts images/videos into WhatsApp stickers.
    *   `toimg` (`ti`): Converts static stickers back into images.
*   **📥 Downloader**
    *   `ytdl` / `ytdlf`: Robust YouTube and general media downloading via `yt-dlp` integration (supports formats and queues).
    *   `danbooru`: Fetches high-quality images from Danbooru via tags and direct links.
    *   `tag`: Fetch danbooru tags
*   **⚙️ Utility**
    *   `resend`: Extracts and resends "View Once" media or messages.

### 🔍 Auto-Detect System
The bot features a modular background auto-detect registry (`lib/autoDetect.js`) that automatically responds to specific patterns in messages without needing explicit commands:
*   **Danbooru URL Detection**: Automatically fetches and sends the highest quality image when a Danbooru post link is shared in chat.

## 🛠️ Tech Stack & Requirements

*   **Runtime:** Node.js (v16+ recommended)
*   **Library:** `@whiskeysockets/baileys`
*   **Key Dependencies:** `axios`, `wa-sticker-formatter`, `dotenv`
*   **External Requirements:** 
    *   [FFmpeg](https://ffmpeg.org/) (Required for sticker creation and media conversion)
    *   [yt-dlp](https://github.com/yt-dlp/yt-dlp) (Required for downloading media via `ytdl` commands)

## 🚀 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Tederby/wa-bot.git
   cd wa-bot
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Install System Dependencies (Important):**
   Make sure you have `ffmpeg` and `yt-dlp` installed and added to your system's PATH.

4. **Environment Variables:**
   Copy the example environment file and configure your details:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to set your `OWNER_NUMBER` and `BOT_NAME`.

5. **Start the bot:**
   ```bash
   npm start
   ```

6. **Link to WhatsApp:**
   Upon running the bot for the first time, a QR code will be generated in the terminal. Open WhatsApp on your phone, go to **Linked Devices**, and scan the QR code. The session will be saved in the `session/` folder for subsequent logins.

## 📂 Project Structure

```text
simple-whatsapp-bot/
├── commands/       # Modular command files (Auto-loaded)
│   ├── _registry.js# Dynamic command loader using fs.readdirSync
│   └── ...         # Command files (.js)
├── lib/            # Core library and middleware
│   ├── autoDetect.js   # Pattern-based background actions
│   ├── contextBuilder.js # Sender, group, and admin context parsing
│   ├── logger.js       # Centralized logging formatting
│   └── Messages.js     # Baileys message wrapper/serializer
├── services/       # External API services or specific heavy logic
├── session/        # WhatsApp authentication session data (Auto-generated)
├── temp/           # Temporary folder for media processing (Auto-generated)
├── index.js        # Main application entry point & connection logic
├── handler.js      # Middleware pipeline (context -> autodetect -> parse -> execute)
├── setting.js      # Global configuration structures
├── .env            # Private environment variables (Owner, Bot Name)
└── package.json    # Project metadata and dependencies
```

## 🧑‍💻 Creating New Commands

Adding a new command is as simple as creating a new `.js` file inside the `commands/` directory. The bot uses an auto-loader (`_registry.js`), so you **do not** need to manually import it anywhere.

**Example `commands/hello.js`:**
```javascript
export default {
    name: "hello",
    aliases: ["hi", "greet"],
    category: "core", // Used for grouping in the menu
    usage: "hello",   // Example usage
    description: "Sends a greeting message",
    async handler({ message }) {
        await message.reply("Hello there! 👋");
    }
};
```

## ⚙️ Configuration

Configurations are handled in two places:
1. **`.env`**: For private and environment-specific data (like `OWNER_NUMBER`).
2. **`setting.js`**: For structural configurations (like prefixes, temporary file management limits, and specific service configs like `ytdlp`).

## 📝 License
This project is open-sourced under the [MIT License](LICENSE).
