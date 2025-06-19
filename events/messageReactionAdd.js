// /events/messageReactionAdd.js

const { handlePublicScan } = require('../lib/publicScanHandler');
const { processFlaggedReview } = require('../lib/modReview');
const { addVote } = require('../lib/voteUtils');

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
            if (entry && !['?', '❓', '✅', '❌', '🔁'].includes(emoji)) {
                addVote(entry, user.id, event);
            }
        }

        // === Öffentlicher Scan bei ? / ❓ ===
        if (!['?', '❓'].includes(emoji)) return;
        if (!message.attachments || message.attachments.size === 0) return;

        const attachment = message.attachments.first();
        await handlePublicScan(message, attachment, client);
    }
};
