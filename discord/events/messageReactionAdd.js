const axios = require('axios');

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
            const imageResp = await axios.get(attachment.url, { responseType: 'arraybuffer' });
            const apiUrl = process.env.SCANNER_API_URL || 'https://example.com/scan';
            const scanResp = await axios.post(apiUrl, imageResp.data, {
                headers: { 'Content-Type': 'application/octet-stream' }
            });

            const data = scanResp.data || {};
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
