/**
 * Bash Command — Remote/Local Shell Execution via WhatsApp
 *
 * Allows the owner to execute bash commands directly on the VPS.
 * - If bot runs on Linux (VPS): executes locally via /bin/bash
 * - If bot runs on Windows (dev): tunnels via SSH to VPS
 *
 * Output is always wrapped in WhatsApp monospace code blocks (```).
 * Includes timeout protection and output truncation for message limits.
 *
 * Security: ownerOnly — only owner numbers can execute this command.
 */

import { exec } from "child_process";
import os from "os";

// ── Configuration ───────────────────────────────────────────────────────────
const SSH_HOST = "103.168.146.150";
const SSH_PORT = 40015;
const SSH_USER = "root";
const EXEC_TIMEOUT = 60_000;        // 60 seconds max per command
const MAX_OUTPUT_LENGTH = 4000;     // WhatsApp safe limit (chars)
const SHELL = "/bin/bash";

/**
 * Determine whether the bot is running on the VPS (Linux) or dev machine.
 * On Linux/VPS we execute directly; on Windows we tunnel through SSH.
 */
const isVPS = os.platform() === "linux";

/**
 * Execute a shell command and return { stdout, stderr, code }.
 */
function executeCommand(command) {
    return new Promise((resolve) => {
        let shellCmd;
        let execOptions;

        if (isVPS) {
            // Running on VPS — execute directly with bash
            shellCmd = command;
            execOptions = {
                shell: SHELL,
                timeout: EXEC_TIMEOUT,
                maxBuffer: 1024 * 1024 * 10, // 10MB buffer
                env: { ...process.env, TERM: "dumb", LANG: "en_US.UTF-8" },
            };
        } else {
            // Running on Windows dev — tunnel via SSH
            // Escape single quotes in command for SSH wrapping
            const escaped = command.replace(/'/g, "'\\''");
            shellCmd = `ssh -p ${SSH_PORT} -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${SSH_USER}@${SSH_HOST} '${SHELL} -c "${escaped.replace(/"/g, '\\"')}"'`;
            execOptions = {
                timeout: EXEC_TIMEOUT + 10_000, // Extra time for SSH overhead
                maxBuffer: 1024 * 1024 * 10,
            };
        }

        exec(shellCmd, execOptions, (error, stdout, stderr) => {
            resolve({
                stdout: stdout || "",
                stderr: stderr || "",
                code: error ? error.code || 1 : 0,
                killed: error?.killed || false,
                signal: error?.signal || null,
            });
        });
    });
}

/**
 * Truncate output if it exceeds WhatsApp's practical message limit.
 * Appends a truncation notice if trimmed.
 */
function truncate(text, maxLen = MAX_OUTPUT_LENGTH) {
    if (text.length <= maxLen) return text;
    const truncated = text.slice(0, maxLen);
    return truncated + `\n\n... [terpotong, ${text.length - maxLen} karakter lagi]`;
}

/**
 * Strip ANSI escape codes from terminal output.
 */
function stripAnsi(str) {
    // eslint-disable-next-line no-control-regex
    return str.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, "");
}

export default {
    name: "bash",
    aliases: ["sh", "exec", "terminal", "shell"],
    category: "owner",
    description: "Eksekusi command bash di VPS (owner only)",
    usage: "!bash <command>",
    ownerOnly: true,

    async handler({ message, rawArgs }) {
        // ── Validate input ──────────────────────────────────────────
        if (!rawArgs || !rawArgs.trim()) {
            return message.reply(
                "```[bash] Masukkan command yang ingin dieksekusi.\n\n" +
                "Contoh:\n" +
                "  !bash ls -la\n" +
                "  !bash df -h\n" +
                "  !bash cat /etc/os-release\n" +
                "  !$ uptime```"
            );
        }

        const command = rawArgs.trim();

        // ── Send "executing" indicator ──────────────────────────────
        await message.reply(`\`\`\`⏳ Executing...\n$ ${command}\`\`\``);

        // ── Execute ─────────────────────────────────────────────────
        const startTime = Date.now();
        const result = await executeCommand(command);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

        // ── Build output ────────────────────────────────────────────
        let output = "";

        // Combine stdout and stderr
        const stdout = stripAnsi(result.stdout).trim();
        const stderr = stripAnsi(result.stderr).trim();

        if (stdout) output += stdout;
        if (stderr) {
            if (output) output += "\n\n";
            output += `[stderr]\n${stderr}`;
        }

        // Handle empty output
        if (!output) {
            output = "(no output)";
        }

        // ── Format response ─────────────────────────────────────────
        let header = `$ ${command}\n`;
        header += `─`.repeat(Math.min(command.length + 2, 30)) + "\n";

        let footer = "\n" + `─`.repeat(30) + "\n";
        footer += `exit: ${result.code}`;
        footer += ` | ${elapsed}s`;
        if (isVPS) footer += " | local";
        else footer += " | ssh";
        if (result.killed) footer += " | ⚠️ TIMEOUT";

        // Truncate the output body, keeping header/footer intact
        const maxBodyLen = MAX_OUTPUT_LENGTH - header.length - footer.length - 10;
        const body = truncate(output, maxBodyLen);

        const response = "```" + header + body + footer + "```";

        await message.reply(response);
    },
};
