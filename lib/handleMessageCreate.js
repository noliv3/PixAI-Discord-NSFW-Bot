// /lib/handleMessageCreate.js

const { isImageUrl } = require('./urlSanitizer');
const { scanImage } = require('./scan');
const { isRecentlyScanned, markScanned } = require('./scanCache');
const { handleImageScan } = require('./handleImageScan');
const { handleEventUpload } = require('./handleEventUpload');
const { handleVideoScan } = require('./handleVideoScan');
const scannerConfig = require('./scannerConfig');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

async function handleMessageCreate(message, client) {
    if (!message.guild || message.author.bot || !message.attachments.size) return;

    const event = client.activeEvents?.get(message.channel.id);
    if (!event) return;

    const attachment = [...message.attachments.values()][0];
    const ext = path.extname(attachment.name || '').toLowerCase();
    const isVideo = ['.mp4', '.webm', '.mov', '.gif'].includes(ext);
    const isImage = attachment.contentType?.startsWith('image/') || await isImageUrl(attachment.url);
    if (!isImage && !isVideo) return;

    if (isRecentlyScanned(message.id)) return;
    markScanned(message.id);

    const response = await axios.get(attachment.url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    const config = scannerConfig.get();
    let scanResult = null;

    if (isVideo) {
        const type = ext === '.gif' ? 'gif' : 'video';
        console.log(`[SCAN] Detected ${type.toUpperCase()} – scanning buffer...`);
        scanResult = await handleVideoScan(buffer, type, config);
    } else {
        console.log('[SCAN] Detected IMAGE – scanning via URL...');
        scanResult = await handleImageScan(attachment.url);
    }

    if (!scanResult) return;
    if (scanResult.level === 0) {
        try {
            await message.delete();
        } catch {}
        return;
    }

    const userEntries = event.entries.filter(e => e.userId === message.author.id);
    if (userEntries.length >= event.max_entries) {
        await message.reply(`You've reached the max of ${event.max_entries} uploads.`);
        return;
    }

    const folder = event.folder;
    const timestamp = Date.now();
    const filename = `${event.name}_${message.author.id}_${message.id}_rate0_${timestamp}.jpg`;
    const filepath = path.join(folder, filename);

    fs.writeFileSync(filepath, buffer);

    event.entries.push({
        messageId: message.id,
        userId: message.author.id,
        filename,
        reactionUsers: new Set()
    });
    event.users.add(message.author.id);

    console.log(`Saved: ${filename}`);
}

module.exports = { handleMessageCreate };
