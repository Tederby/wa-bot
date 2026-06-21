import chalk from "chalk";

// ── Color helper ────────────────────────────────────────────────────────────

/**
 * Get text with color using chalk keyword colors.
 * @param  {string} text
 * @param  {string} [color] - chalk keyword color (e.g. "yellow", "red"). Defaults to green.
 * @return {string}
 */
export const color = (text, color) => {
    return !color ? chalk.green(text) : chalk.keyword(color)(text);
};

// ── Spam filter ─────────────────────────────────────────────────────────────

const usedCommandRecently = new Set();

/**
 * Check if a chat ID is currently on cooldown.
 * @param  {string} chatId
 * @returns {boolean}
 */
const isFiltered = (chatId) => usedCommandRecently.has(chatId);

/**
 * Put a chat ID on cooldown for `delayMs` milliseconds.
 * @param  {string} chatId
 * @param  {number} delayMs
 */
const addFilter = (chatId, delayMs) => {
    usedCommandRecently.add(chatId);
    setTimeout(() => usedCommandRecently.delete(chatId), delayMs);
};

export const msgFilter = { isFiltered, addFilter };

// ── URL validation ──────────────────────────────────────────────────────────

/**
 * Check if a string is a valid HTTP(S) URL.
 * @param  {string} url
 * @returns {RegExpMatchArray | null}
 */
export const isUrl = (url) => {
    return url.match(
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,50}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi
    );
};

// ── Filename sanitizer ──────────────────────────────────────────────────────

/**
 * Remove characters unsafe for filenames.
 * @param {string} str
 * @returns {string}
 */
export function sanitizeFilename(str) {
    return str
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
        .replace(/\s+/g, "_")
        .trim() || "download";
}
