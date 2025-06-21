// /lib/modReview.js

const { PermissionsBitField } = require('discord.js');

/**
 * Processes moderator review emoji reactions (❌ and ⚠️).
 *
 * @param {MessageReaction} reaction
 * @param {User} user
 * @param {Client} client
 * @returns {Promise<boolean>} true if handled
 */
async function processFlaggedReview(reaction, user, client) {
    const emoji = reaction.emoji.name;
    const message = reaction.message;

    // Passive votes (👍👎) do nothing in this context
    if (emoji === '👍' || emoji === '👎') return false;

    const modChannelId = client.config?.moderatorChannelId;
    if (!modChannelId || message.channel.id !== modChannelId) return false;

    const flagged = client.flaggedReviews?.get(message.id);
    if (!flagged) return false;

    const member = await message.guild.members.fetch(user.id);
    if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return false;

    const targetMessage = flagged.originalMessage;
    const flaggedUser = flagged.originalUser;

    if (emoji === '❌') {
        try {
            await targetMessage.delete();
            await message.reply(`❌ Deleted post by <@${flaggedUser.id}>`);
        } catch {}
        client.flaggedReviews.delete(message.id);
        return true;
    }

    if (emoji === '⚠️') {
        try {
            const rulesChannelId = '1041682785418629122'; // fixed ID for "rules" channel
            await flaggedUser.send(
                `Hello ${flaggedUser.username}, your image violates our server rules.\n` +
                `You were warned by moderator: ${user.tag}\n\n` +
                `Please review our community guidelines in <#${rulesChannelId}>`
            );
            await message.reply(`⚠️ Warned user <@${flaggedUser.id}>`);
        } catch {}
        client.flaggedReviews.delete(message.id);
        return true;
    }

    // ❌ and ⚠️ handled; all others ignored
    return false;
}

module.exports = { processFlaggedReview };
