const axios = require('axios');
const fs = require('fs/promises');
const path = require('path');
const scannerConfig = require('../lib/scannerConfig');
const { scanImage, scanBuffer } = require('../lib/scan');
const { extractFrames } = require('../lib/videoFrameExtractor');
const { isImageUrl } = require('../lib/urlSanitizer');
const { getFilters } = require('../lib/filterManager');
const { extractTags, highlightTags } = require('../lib/tagUtils');
const { isRecentlyScanned, markScanned } = require('../lib/scanCache');

function isImage(attachment) {
    const url = (attachment.url || '').toLowerCase();
    return url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') ||
           url.endsWith('.gif') || url.endsWith('.webp');
}

function isVideo(attachment) {
    const url = (attachment.url || '').toLowerCase();
    return url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov') ||
           url.endsWith('.mkv') || url.endsWith('.avi');
}

function isMedia(attachment) {
    return isImage(attachment) || isVideo(attachment);
}

async function handleScan(attachment, message, client) {
    try {
        const data = await scanImage(attachment.url);
        if (!data) return false;

        const tags = extractTags(data).map(t => t.toLowerCase());
        const filters = getFilters();
        const { flagThreshold, deleteThreshold, moderatorRoleId, moderatorChannelId } = scannerConfig.get();
        const mention = moderatorRoleId ? `<@&${moderatorRoleId}> ` : '';

        const matches = (lvl) => filters[lvl]?.filter(f => tags.includes(f)) || [];

        const match0 = matches(0);
        const match1 = matches(1);
        const match2 = matches(2);
        const matchTags = [...match0, ...match1, ...match2];

        const tagList = highlightTags(tags, matchTags);

        // === Filter 0: Sofort löschen
        if (match0.length > 0) {
            await message.delete().catch(() => {});
            if (moderatorChannelId) {
                const modChannel = await client.channels.fetch(moderatorChannelId);
                await modChannel.send({
                    content: `${mention}🚫 **Deleted image** from ${message.author} (Trigger: ${match0.map(t => `**${t}**`).join(', ')})\n**Tags:** ${tagList}\n[Jump](${message.url})`,
                    files: [attachment.url]
                });
            }
            return true;
        }

        const risk = typeof data.risk === 'number' ? data.risk :
            (typeof data.risk_score === 'number' ? data.risk_score : 0);

        if (risk >= deleteThreshold) {
            await message.delete().catch(() => {});
            if (moderatorChannelId) {
                const modChannel = await client.channels.fetch(moderatorChannelId);
                await modChannel.send({
                    content: `${mention}🚫 **Deleted image** from ${message.author} due to high risk: ${risk}\n**Tags:** ${tagList}\n[Jump](${message.url})`,
                    files: [attachment.url]
                });
            }
            return true;
        }

        if (risk >= flagThreshold || match1.length > 0 || match2.length > 0) {
            if (moderatorChannelId) {
                const modChannel = await client.channels.fetch(moderatorChannelId);
                const summary = await modChannel.send({
                    content: `${mention}⚠️ Flagged image from ${message.author} (risk ${risk})\n**Tags:** ${tagList}\n[Jump](${message.url})`,
                    files: [attachment.url]
                });

                await summary.react('✅');
                await summary.react('❌');
                await summary.react('⚠️');
                await summary.react('🔁');

                if (!client.flaggedReviews) client.flaggedReviews = new Map();
                client.flaggedReviews.set(summary.id, {
                    flaggedMessageId: message.id,
                    channelId: message.channel.id,
                    attachmentUrl: attachment.url,
                    userId: message.author.id
                });
            }
        }

    } catch (err) {
        console.error('Scan failed:', err.stack || err.message);
    }

    return false;
}

async function handleVideoScan(attachment, message, client) {
    try {
        const frames = await extractFrames(attachment.url, [0, 10]);
        for (const frame of frames) {
            const data = await scanBuffer(frame);
            if (!data) continue;

            const tags = extractTags(data).map(t => t.toLowerCase());
            const filters = getFilters();
            const { flagThreshold, deleteThreshold, moderatorRoleId, moderatorChannelId } = scannerConfig.get();

            const matches = (lvl) => filters[lvl]?.filter(f => tags.includes(f)) || [];
            const match0 = matches(0);
            const match1 = matches(1);
            const match2 = matches(2);
            const matchTags = [...match0, ...match1, ...match2];

            const tagList = highlightTags(tags, matchTags);

            if (match0.length > 0) {
                await message.delete().catch(() => {});
                if (moderatorChannelId) {
                    const modChannel = await client.channels.fetch(moderatorChannelId);
                    await modChannel.send({
                        content: `🚫 **Deleted video** from ${message.author} (Trigger: ${match0.map(t => `**${t}**`).join(', ')})\n**Tags:** ${tagList}\n[Jump](${message.url})`,
                        files: [attachment.url]
                    });
                }
                return true;
            }

            const risk = typeof data.risk === 'number' ? data.risk :
                (typeof data.risk_score === 'number' ? data.risk_score : 0);

            if (risk >= deleteThreshold) {
                await message.delete().catch(() => {});
                if (moderatorChannelId) {
                    const modChannel = await client.channels.fetch(moderatorChannelId);
                    await modChannel.send({
                        content: `🚫 **Deleted video** from ${message.author} due to high risk: ${risk}\n**Tags:** ${tagList}\n[Jump](${message.url})`,
                        files: [attachment.url]
                    });
                }
                return true;
            }

            if (risk >= flagThreshold || match1.length > 0 || match2.length > 0) {
                if (moderatorChannelId) {
                    const modChannel = await client.channels.fetch(moderatorChannelId);
                    const summary = await modChannel.send({
                        content: `⚠️ Flagged video from ${message.author} (risk ${risk})\n**Tags:** ${tagList}\n[Jump](${message.url})`,
                        files: [attachment.url]
                    });

                    await summary.react('✅');
                    await summary.react('❌');
                    await summary.react('⚠️');
                    await summary.react('🔁');

                    if (!client.flaggedReviews) client.flaggedReviews = new Map();
                    client.flaggedReviews.set(summary.id, {
                        flaggedMessageId: message.id,
                        channelId: message.channel.id,
                        attachmentUrl: attachment.url,
                        userId: message.author.id
                    });
                }
            }
        }
    } catch (err) {
        console.error('Video scan failed:', err.stack || err.message);
    }

    return false;
}

async function execute(message, client) {
        if (message.author.bot) return;

        if (message.content.startsWith('!')) {
            const args = message.content.slice(1).trim().split(/\s+/);
            const commandName = args.shift().toLowerCase();
            const command = client.commands.get(commandName);
            if (command) {
                try {
                    await command.execute(message, client, args);
                } catch (error) {
                    console.error(error);
                    await message.reply('There was an error executing that command.');
                }
            }
        }

        if (isRecentlyScanned(message.id)) return;
        markScanned(message.id);

        const attachments = [...message.attachments.values()];
        const urls = [...message.content.matchAll(/https?:\/\/\S+/gi)].map(m => m[0]);
        const allTargets = [...attachments, ...urls.map(url => ({ url }))];

        const channelId = message.channel.id;
        const event = client.activeEvents && client.activeEvents.get(channelId);
        let notifiedLimit = false;

        for (const item of allTargets) {
            const isImg = item.filename ? isImage(item) : await isImageUrl(item.url);
            const isVid = item.filename ? isVideo(item) : false;

            if (!isImg && !isVid) continue;

            let scanDeleted = false;

            if (isVid) {
                scanDeleted = await handleVideoScan(item, message, client);
            } else if (isImg) {
                scanDeleted = await handleScan(item, message, client);
            }
            if (scanDeleted) continue;

            if (event && item.filename) {
                const count = event.entries.filter(e => e.userId === message.author.id).length;
                if (count >= event.max_entries) {
                    if (!notifiedLimit) {
                        try {
                            await message.reply(`⛔ You reached the maximum of ${event.max_entries} entries for this event.`);
                        } catch {}
                        notifiedLimit = true;
                    }
                    continue;
                }

                try {
                    const ext = path.extname(new URL(item.url).pathname);
                    const filename = `${event.name}_${message.author.id}_${message.id}_rate0_${Date.now()}${ext}`;
                    const dest = path.join(event.folder, filename);
                    const imgData = await axios.get(item.url, { responseType: 'arraybuffer' });
                    await fs.writeFile(dest, imgData.data);

                    event.entries.push({
                        messageId: message.id,
                        userId: message.author.id,
                        filename,
                        reactionUsers: new Set()
                    });
                    event.users.add(message.author.id);
                } catch (err) {
                    console.error('Failed to save attachment:', err.stack || err.message);
                }
            }

        }
    }

module.exports = {
    name: 'messageCreate',
    execute,
    isImage,
    isVideo,
    isMedia,
    handleScan,
    handleVideoScan
};
