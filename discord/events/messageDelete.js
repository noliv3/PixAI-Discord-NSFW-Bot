const fs = require('fs');
const path = require('path');
const axios = require('axios');
const scannerConfig = require('../lib/scannerConfig');

module.exports = {
    name: 'messageDelete',
    async execute(message, client) {
        if (message.partial) {
            try {
                message = await message.fetch();
            } catch {
                return;
            }
        }

        if (!message.attachments || message.attachments.size === 0) return;

        const deletedDir = path.join(__dirname, '..', 'deleted');
        if (!fs.existsSync(deletedDir)) {
            fs.mkdirSync(deletedDir, { recursive: true });
        }

        const timestamp = Date.now();

        for (const attachment of message.attachments.values()) {
            try {
                const ext = path.extname(new URL(attachment.url).pathname);
                const filename = `${message.author.id}_${timestamp}${ext}`;
                const dest = path.join(deletedDir, filename);
                const resp = await axios.get(attachment.url, { responseType: 'arraybuffer' });
                fs.writeFileSync(dest, resp.data);
            } catch (err) {
                console.error('Failed to save deleted attachment:', err.message);
            }
        }

        console.log(`Deleted message from ${message.author.tag} saved.`);

        const { moderatorChannelId } = scannerConfig.get();
        if (moderatorChannelId) {
            try {
                const ch = await client.channels.fetch(moderatorChannelId);
                await ch.send(`🗑️ Message from ${message.author.tag} deleted in <#${message.channel.id}>. Attachments archived.`);
            } catch (err) {
                console.error('Failed to notify moderator channel:', err.message);
            }
        }
    }
};

