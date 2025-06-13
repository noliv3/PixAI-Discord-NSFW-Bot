const axios = require('axios');
const fs = require('fs');
const path = require('path');
const scannerConfig = require('../lib/scannerConfig');

function isImage(attachment) {
    const url = (attachment.url || '').toLowerCase();
    return url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') ||
        url.endsWith('.gif') || url.endsWith('.webp');
}

async function scanImage(url) {
    const imgResp = await axios.get(url, { responseType: 'arraybuffer' });
    const apiUrl = process.env.SCANNER_API_URL || 'https://example.com/scan';
    const resp = await axios.post(apiUrl, imgResp.data, {
        headers: { 'Content-Type': 'application/octet-stream' }
    });
    return resp.data || {};
}

async function handleScan(attachment, message) {
    try {
        const data = await scanImage(attachment.url);
        const risk = typeof data.risk === 'number' ? data.risk :
            (typeof data.risk_score === 'number' ? data.risk_score : 0);

        const { flagThreshold, deleteThreshold, moderatorRoleId, moderatorChannelId } = scannerConfig.get();
        const mention = moderatorRoleId ? `<@&${moderatorRoleId}> ` : '';

        if (risk >= deleteThreshold) {
            await message.delete().catch(() => {});
            await message.channel.send(`${mention}Image from ${message.author} deleted. Risk: ${risk}`);
            return true;
        } else if (risk >= flagThreshold) {
            await message.channel.send(`${mention}Image from ${message.author} flagged. Risk: ${risk}`);
            if (moderatorChannelId) {
                try {
                    const modChannel = await message.client.channels.fetch(moderatorChannelId);
                    const summary = await modChannel.send(`Flagged image from ${message.author} (risk ${risk}). [Jump](${message.url})`);
                    await summary.react('✅');
                    await summary.react('❌');
                    await summary.react('🔁');
                    if (!message.client.flaggedReviews) message.client.flaggedReviews = new Map();
                    message.client.flaggedReviews.set(summary.id, {
                        flaggedMessageId: message.id,
                        channelId: message.channel.id,
                        attachmentUrl: attachment.url
                    });
                } catch (err) {
                    console.error('Failed to notify moderator channel:', err.message);
                }
            }
        }
    } catch (err) {
        console.error('Scan failed:', err.message);
    }
    return false;
}

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;

        if (message.content.startsWith('!')) {
            const args = message.content.slice(1).trim().split(/\s+/);
            const commandName = args.shift().toLowerCase();
            const command = client.commands.get(commandName);
            if (command) {
                try {
                    await command.execute(message, args);
                } catch (error) {
                    console.error(error);
                    await message.reply('There was an error executing that command.');
                }
            }
        }

        if (message.attachments && message.attachments.size > 0) {
            const channelId = message.channel.id;
            const event = client.activeEvents && client.activeEvents.get(channelId);

            for (const attachment of message.attachments.values()) {
                if (!isImage(attachment)) continue;

                const scanDeleted = await handleScan(attachment, message);
                if (scanDeleted) continue;

                if (event) {
                    try {
                        const ext = path.extname(new URL(attachment.url).pathname);
                        const filename = `${event.name}_${message.author.id}_${message.id}_rate0_${Date.now()}${ext}`;
                        const dest = path.join(event.folder, filename);
                        const imgData = await axios.get(attachment.url, { responseType: 'arraybuffer' });
                        fs.writeFileSync(dest, imgData.data);

                        event.entries.push({
                            messageId: message.id,
                            userId: message.author.id,
                            filename,
                            reactionUsers: new Set()
                        });
                        event.users.add(message.author.id);
                    } catch (err) {
                        console.error('Failed to save attachment:', err.message);
                    }
                }
            }
        }
    }
};
