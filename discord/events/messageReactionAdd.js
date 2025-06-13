const axios = require('axios');
const scannerConfig = require('../lib/scannerConfig');

async function scanImage(url) {
    const imageResp = await axios.get(url, { responseType: 'arraybuffer' });
    const apiUrl = process.env.SCANNER_API_URL || 'https://example.com/scan';
    const scanResp = await axios.post(apiUrl, imageResp.data, {
        headers: { 'Content-Type': 'application/octet-stream' }
    });
    return scanResp.data || {};
}

module.exports = {
    name: 'messageReactionAdd',
    async execute(reaction, user, client) {
        if (user.bot) return;

        try {
            if (reaction.partial) {
                await reaction.fetch();
            }
            if (reaction.message.partial) {
                await reaction.message.fetch();
            }
        } catch (error) {
            console.error('Reaction fetch failed:', error.message);
            return;
        }

        const emoji = reaction.emoji.name;

        if (client.flaggedReviews && client.flaggedReviews.has(reaction.message.id)) {
            const review = client.flaggedReviews.get(reaction.message.id);
            const guild = reaction.message.guild;
            let member;
            try {
                member = await guild.members.fetch(user.id);
            } catch {
                return;
            }
            const cfg = scannerConfig.get();
            const isMod = (cfg.moderatorRoleId && member.roles.cache.has(cfg.moderatorRoleId)) || member.permissions.has('ManageMessages');
            if (!isMod) return;

            if (emoji === '✅') {
                await reaction.message.reply(`Approved by ${user.tag}`);
                client.flaggedReviews.delete(reaction.message.id);
            } else if (emoji === '❌') {
                try {
                    const channel = await client.channels.fetch(review.channelId);
                    const msg = await channel.messages.fetch(review.flaggedMessageId);
                    await msg.delete();
                    await reaction.message.reply(`Deleted by ${user.tag}`);
                } catch (err) {
                    await reaction.message.reply('Failed to delete message.');
                }
                client.flaggedReviews.delete(reaction.message.id);
            } else if (emoji === '🔁') {
                try {
                    const data = await scanImage(review.attachmentUrl);
                    const tags = Array.isArray(data.tags) ? data.tags : [];
                    const tagNames = tags.slice(0, 10).map(t => typeof t === 'string' ? t : (t.name || t.tag)).filter(Boolean);
                    const tagText = tagNames.join(', ') || 'No tags';
                    await reaction.message.reply(`Rescan: ${tagText}`);
                } catch (err) {
                    await reaction.message.reply('Rescan failed.');
                }
            }
            return;
        }

        if (emoji !== '?' && emoji !== '❓') return;

        const message = reaction.message;
        if (!message.attachments || message.attachments.size === 0) return;

        if (!client.scannedMessages) {
            client.scannedMessages = new Set();
        }
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
