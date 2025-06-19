// /events/messageReactionAdd.js

const fs = require('fs');
const path = require('path');
const scannerConfig = require('../lib/scannerConfig');
const { scanImage } = require('../lib/scan');
const { getFilters } = require('../lib/filterManager');
const { handlePublicScan } = require('../lib/publicScanHandler');

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

        // === Moderator Review ===
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
                const data = await scanImage(review.attachmentUrl);
                if (!data) {
                    await message.reply('Rescan failed.');
                } else {
                    const modules = {};
                    for (const [key, value] of Object.entries(data)) {
                        if (key.startsWith('modules.')) {
                            modules[key.slice(8)] = value;
                        }
                    }

                    const rawTags =
                        modules.deepdanbooru_tags?.tags ||
                        modules.tagging?.tags ||
                        modules.image_storage?.metadata?.danbooru_tags ||
                        modules.image_storage?.metadata?.tags ||
                        [];

                    const tags = Array.isArray(rawTags) ? rawTags : [];
                    const tagNames = tags.slice(0, 10)
                        .map(t => typeof t === 'string' ? t : (t.label || t.name || t.tag))
                        .filter(t => !!t && t.toLowerCase() !== 'rating:safe');
                    const tagText = tagNames.join(', ') || '—';

                    await message.reply(`Rescan: ${tagText}`);
                }
            }
            return;
        }

        // === Voting-System ===
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

        // === Öffentlicher Scan bei ? / ❓ ===
        if (!['?', '❓'].includes(emoji)) return;
        if (!message.attachments || message.attachments.size === 0) return;

        const attachment = message.attachments.first();
        await handlePublicScan(message, attachment, client);
    }
};
