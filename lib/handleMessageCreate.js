// /lib/handleMessageCreate.js

const { isImageUrl } = require('./urlSanitizer');
const { scanImage, scanBuffer } = require('./scan');
const { extractTags } = require('./tagUtils');
const { evaluateTags } = require('./scannerFilter');
const { isRecentlyScanned, markScanned } = require('./scanCache');
const { getFilters } = require('./filterManager');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

async function handleMessageCreate(message, client) {
    if (!message.guild || message.author.bot || !message.attachments.size) return;

    const event = client.activeEvents?.get(message.channel.id);
    if (!event) return; // no active event in this channel

    const attachment = [...message.attachments.values()][0];
    const isImage = attachment.contentType?.startsWith('image/') || await isImageUrl(attachment.url);
    if (!isImage) return;

    if (isRecentlyScanned(message.id)) return;
    markScanned(message.id);

    const scan = await scanImage(attachment.url);
    if (!scan) return;

    const tags = extractTags(scan).map(t => t.toLowerCase());
    const filterResult = evaluateTags(tags);
    if (filterResult.level === 0) {
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

    const response = await axios.get(attachment.url, { responseType: 'arraybuffer' });
    fs.writeFileSync(filepath, response.data);

    event.entries.push({
        messageId: message.id,
        userId: message.author.id,
        filename,
        reactionUsers: new Set()
    });
    event.users.add(message.author.id);

    console.log(`Image saved: ${filename}`);
}

module.exports = { handleMessageCreate };
