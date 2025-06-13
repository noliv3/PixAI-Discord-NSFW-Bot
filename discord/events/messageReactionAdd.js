const fs = require('fs');
const path = require('path');
const axios = require('axios');
const scannerConfig = require('../lib/scannerConfig');

async function scanImage(url) {
    const resp = await axios.get(url, { responseType: 'arraybuffer' });
    const apiUrl = process.env.SCANNER_API_URL || 'https://example.com/scan';
    const scan = await axios.post(apiUrl, resp.data, {
        headers: { 'Content-Type': 'application/octet-stream' }
    });
    return scan.data || {};
}

module.exports = {
    name: 'messageReactionAdd',
    async execute(reaction, user, client) {
        if (user.bot) return;

        try {
            if (reaction.partial) await reaction.fetch();
            if (reaction.message.partial) await reaction.message.fetch();
        } catch (err) {
            console.error('Reaction fetch failed:', err.message);
            return;
        }

        const emoji = reaction.emoji.name;
        const message = reaction.message;

        // Handle moderator review reactions first
        if (client.flaggedReviews && client.flaggedReviews.has(message.id)) {
            const review = client.flaggedReviews.get(message.id);
            const guild = message.guild;
            let member;
            try {
                member = await guild.members.fetch(user.id);
            } catch {
                return;
            }
            const cfg = scannerConfig.get();
            const isMod = (cfg.moderatorRoleId && member.roles.cache.has(cfg.moderatorRoleId)) ||
                member.permissions.has('ManageMessages');
            if (!isMod) return;

            if (emoji === '✅') {
                await message.reply(`Approved by ${user.tag}`);
                client.flaggedReviews.delete(message.id);
            } else if (emoji === '❌') {
                try {
                    const channel = await client.channels.fetch(review.channelId);
                    const msg = await channel.messages.fetch(review.flaggedMessageId);
                    await msg.delete();
                    await message.reply(`Deleted by ${user.tag}`);
                } catch (err) {
                    await message.reply('Failed to delete message.');
                }
                client.flaggedReviews.delete(message.id);
            } else if (emoji === '🔁') {
                try {
                    const data = await scanImage(review.attachmentUrl);
                    const tags = Array.isArray(data.tags) ? data.tags : [];
                    const tagNames = tags.slice(0, 10).map(t => typeof t === 'string' ? t : (t.name || t.tag)).filter(Boolean);
                    const tagText = tagNames.join(', ') || 'No tags';
                    await message.reply(`Rescan: ${tagText}`);
                } catch (err) {
                    await message.reply('Rescan failed.');
                }
            }
            return;
        }

        const channelId = message.channel.id;
        const event = client.activeEvents && client.activeEvents.get(channelId);
        if (event) {
            const entry = event.entries.find(e => e.messageId === message.id);
            if (entry) {
                if (!['?', '❓', '✅', '❌', '🔁'].includes(emoji)) {
                    if (entry.reactionUsers.has(user.id)) return;
                    entry.reactionUsers.add(user.id);

                    const oldPath = path.join(event.folder, entry.filename);
                    const newScore = entry.reactionUsers.size;
                    const newFilename = entry.filename.replace(/_rate\d+_/, `_rate${newScore}_`);
                    const newPath = path.join(event.folder, newFilename);

                    if (newFilename !== entry.filename) {
                        try {
                            fs.renameSync(oldPath, newPath);
                            entry.filename = newFilename;
                        } catch (err) {
                            console.error('Failed to rename file:', err.message);
                        }
                    }
                }
            }
        }

        // Scan handling with ? or ❓ reactions
        if (emoji !== '?' && emoji !== '❓') return;

        if (!message.attachments || message.attachments.size === 0) return;

        if (!client.scannedMessages) client.scannedMessages = new Set();
        if (client.scannedMessages.has(message.id)) return;
        client.scannedMessages.add(message.id);

        const attachment = message.attachments.first();
        try {
            const data = await scanImage(attachment.url);
            const tags = Array.isArray(data.tags) ? data.tags : [];
            const tagNames = tags.slice(0, 10).map(t => typeof t === 'string' ? t : (t.name || t.tag)).filter(Boolean);
            const tagText = tagNames.join(', ') || 'No tags';
            const needsReview = data.needs_review || data.flagged || data.safe === false;
            const status = needsReview ? '❗' : '✅';
            await message.channel.send(`${tagText} ${status}`);
        } catch (err) {
            console.error('Scan failed:', err.message);
            await message.channel.send('Image scan failed.');
        }
    }
};
