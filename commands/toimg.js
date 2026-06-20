import { downloadContentFromMessage } from 'baileys';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = promisify(exec);

export default {
    name: 'toimg',
    aliases: ['toimage', 'tovideo'],
    description: 'Mengubah stiker menjadi gambar atau video',
    async handler({ message, sock }) {
        try {
            // Check for sticker message
            const isQuotedSticker = message.quoted?.message?.stickerMessage;
            const isSticker = message.message?.stickerMessage;
            const targetMsg = isQuotedSticker ? message.quoted : (isSticker ? message : null);

            if (!targetMsg) {
                return await message.reply('❌ Balas (reply) stiker yang ingin diubah menjadi gambar/video dengan caption *!toimg*.');
            }

            const stickerMsg = targetMsg.message.stickerMessage;
            const isAnimated = stickerMsg.isAnimated || false;

            await message.reply(isAnimated ? '⏳ Sedang mengonversi stiker ke video...' : '⏳ Sedang mengonversi stiker ke gambar...');

            // Download sticker
            const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // Write to temp file
            const tempDir = path.resolve('./temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const timestamp = Date.now();
            const inputPath = path.join(tempDir, `${timestamp}_sticker.webp`);
            const outputPath = path.join(tempDir, `${timestamp}_output.${isAnimated ? 'mp4' : 'jpg'}`);

            fs.writeFileSync(inputPath, buffer);

            // Convert using ffmpeg
            try {
                if (isAnimated) {
                    // Convert animated webp to mp4
                    await execPromise(`ffmpeg -i "${inputPath}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${outputPath}"`);
                } else {
                    // Convert static webp to jpg
                    await execPromise(`ffmpeg -i "${inputPath}" "${outputPath}"`);
                }

                const outputBuffer = fs.readFileSync(outputPath);

                if (isAnimated) {
                    await sock.sendMessage(message.chat, { video: outputBuffer, caption: '✅ Stiker animasi berhasil diubah ke video.' }, { quoted: message });
                } else {
                    await sock.sendMessage(message.chat, { image: outputBuffer, caption: '✅ Stiker berhasil diubah ke gambar.' }, { quoted: message });
                }

            } catch (ffmpegErr) {
                console.error('[FFMPEG ERROR]', ffmpegErr);
                await message.reply('❌ Gagal mengonversi stiker. Pastikan server memiliki ffmpeg yang terinstal.');
            } finally {
                // Cleanup
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            }

        } catch (error) {
            console.error('[ERROR TOIMG]', error);
            await message.reply('❌ Terjadi kesalahan internal saat memproses stiker.');
        }
    }
};
