/**
 * Command & Reply Handler Registry
 *
 * - Commands are auto-loaded from every .js file in this directory (except _registry.js).
 * - Each command module must `export default { name, handler, ... }`.
 * - Supports hot-reload: `reloadCommand(filePath)` re-imports and re-registers
 *   a single command without touching other state (reply handlers, etc.).
 * - Reply handlers are registered per bot-message stanzaId so that follow-up
 *   replies (e.g. ytdlf format selection) can be routed back to the originating command.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { color } from "../lib/utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Command Registry ────────────────────────────────────────────────────────

const commands = new Map();

/**
 * Register a command by name + aliases.
 * If a command with the same name was already registered, its old aliases
 * are cleaned up first to avoid ghost entries.
 */
function register(cmd) {
    // Clean up old aliases if re-registering the same command name
    const existing = commands.get(cmd.name);
    if (existing && existing.aliases) {
        for (const alias of existing.aliases) {
            // Only delete if the alias still points to the OLD command
            if (commands.get(alias) === existing) {
                commands.delete(alias);
            }
        }
    }

    commands.set(cmd.name, cmd);
    if (cmd.aliases) {
        for (const alias of cmd.aliases) {
            commands.set(alias, cmd);
        }
    }
}

/**
 * Load a single command file (initial load — no cache-bust).
 * Uses the plain file URL so Node.js resolves circular imports normally.
 *
 * @param {string} file - Filename (e.g. "ping.js")
 * @returns {Promise<string|null>} Command name if successful, null if failed
 */
async function loadSingleFile(file) {
    try {
        const absPath = path.join(__dirname, file);
        const fileUrl = pathToFileURL(absPath).href;
        const mod = await import(fileUrl);
        const cmd = mod.default;

        if (cmd && cmd.name && typeof cmd.handler === "function") {
            register(cmd);
            return cmd.name;
        } else {
            console.warn(color("[REGISTRY]", "yellow"), `Skipped ${file}: missing name or handler`);
            return null;
        }
    } catch (err) {
        console.error(color("[REGISTRY]", "red"), `Failed to load ${file}:`, err.message);
        return null;
    }
}

/**
 * Hot-reload a single command file (with cache-bust).
 * The ?t= query forces Node.js to re-evaluate the module instead of
 * returning the cached version.
 *
 * @param {string} file - Filename (e.g. "ping.js")
 * @returns {Promise<string|null>} Command name if successful, null if failed
 */
async function hotLoadSingleFile(file) {
    try {
        const absPath = path.join(__dirname, file);
        const fileUrl = pathToFileURL(absPath).href + `?t=${Date.now()}`;
        const mod = await import(fileUrl);
        const cmd = mod.default;

        if (cmd && cmd.name && typeof cmd.handler === "function") {
            register(cmd);
            return cmd.name;
        } else {
            console.warn(color("[REGISTRY]", "yellow"), `Skipped ${file}: missing name or handler`);
            return null;
        }
    } catch (err) {
        console.error(color("[REGISTRY]", "red"), `Failed to load ${file}:`, err.message);
        return null;
    }
}

/**
 * Initialize the command registry by loading all command files.
 * Must be called from index.js AFTER all static imports have settled
 * to avoid circular dependency deadlocks.
 */
export async function initCommands() {
    const files = fs.readdirSync(__dirname)
        .filter((f) => f.endsWith(".js") && !f.startsWith("_"));

    for (const file of files) {
        await loadSingleFile(file);
    }

    const unique = [...new Set(commands.values())];
    console.log(
        color("[REGISTRY]"),
        `Loaded ${unique.length} command(s): ${unique.map((c) => c.name).join(", ")}`
    );
}

// ── Hot-Reload API ──────────────────────────────────────────────────────────

/**
 * Reload a single command file by its absolute path.
 * Called by the file watcher in index.js when a command file changes.
 *
 * @param {string} absPath - Absolute path to the .js file
 * @returns {Promise<boolean>} true if reload succeeded
 */
export async function reloadCommand(absPath) {
    const file = path.basename(absPath);

    // Don't reload this registry file itself
    if (file.startsWith("_") || !file.endsWith(".js")) return false;

    // Use cache-busted import so Node re-evaluates the module
    const cmdName = await hotLoadSingleFile(file);
    if (cmdName) {
        console.log(
            color("[HOT-RELOAD]", "yellow"),
            `Command "${cmdName}" reloaded from ${file}`
        );
        return true;
    }
    return false;
}

/** The absolute path to the commands directory (for watchers). */
export const commandsDir = __dirname;

// ── Command Lookup ──────────────────────────────────────────────────────────

/**
 * Look up a command by its exact name or alias.
 * @param {string} name
 * @returns {object|null}
 */
export function getCommand(name) {
    return commands.get(name) || null;
}

/** Return unique command objects (no alias duplicates). */
export function getAllCommands() {
    return [...new Set(commands.values())];
}

// ── Reply Handler Registry ──────────────────────────────────────────────────

/** @type {Map<string, { handler: Function, state: object, createdAt: number }>} */
const replyHandlers = new Map();

/**
 * Register a handler that will fire when a user replies to a specific bot message.
 * @param {string} stanzaId  - The message ID of the bot's message
 * @param {Function} handler - async ({ message, sock, state }) => void
 * @param {object} state     - Arbitrary state to pass back to the handler
 */
export function registerReplyHandler(stanzaId, handler, state) {
    replyHandlers.set(stanzaId, { handler, state, createdAt: Date.now() });
}

/** @returns {{ handler: Function, state: object, createdAt: number } | null} */
export function getReplyHandler(stanzaId) {
    return replyHandlers.get(stanzaId) || null;
}

export function deleteReplyHandler(stanzaId) {
    replyHandlers.delete(stanzaId);
}

/**
 * Remove reply handlers older than `maxAgeMs`.
 * Called periodically from the cleanup service.
 * @param {number} maxAgeMs
 * @returns {number} Number of entries purged
 */
export function cleanupExpiredReplyHandlers(maxAgeMs) {
    const now = Date.now();
    let purged = 0;
    for (const [id, entry] of replyHandlers) {
        if (now - entry.createdAt > maxAgeMs) {
            replyHandlers.delete(id);
            purged++;
        }
    }
    return purged;
}
