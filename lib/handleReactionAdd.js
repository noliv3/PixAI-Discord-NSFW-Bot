// /lib/handleReactionAdd.js

const { handlePublicScan } = require('./publicScanHandler');
const { processFlaggedReview } = require('./modReview');
const { addVote, updateVoteCount } = require('./voteUtils');

/**
 * Handles a reaction added to a message (voting, moderation, or public scan).
 *
 * @param {MessageReaction} reaction
 * @param {User} user
 * @param {Client} client
 */
async function handleReactionAdd(reaction, user, client) {
    if (user.bot) return;

    const message = reaction.message;
    const emoji = reaction.emoji.name;

    // === Moderator Review ===
    if (await processFlaggedReview(reaction, user, client)) return;

    // === Event Voting ===
    const event = client.activeEvents?.get(message.channel.id);
    if (event) {
        const entry = event.entries.find(e => e.messageId === message.id);
        if (entry && !['?', '❓', '✅', '❌', '🔁'].includes(emoji)) {
            addVote(entry, user.id, event);
            await updateVoteCount(entry, event.folder);
        }
    }

    // === Public Scan Trigger ===
    if (['?', '❓'].includes(emoji)) {
        if (message.attachments && message.attachments.size > 0) {
            const attachment = message.attachments.first();
            await handlePublicScan(message, attachment, client);
        }
    }
}

module.exports = { handleReactionAdd };
