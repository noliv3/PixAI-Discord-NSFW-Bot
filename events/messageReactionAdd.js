// /events/messageReactionAdd.js

const fs = require('fs');
const path = require('path');
const { handlePublicScan } = require('../lib/publicScanHandler');
const { processFlaggedReview } = require('../lib/modReview');

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
        if (await processFlaggedReview(reaction, user, client)) return;

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
