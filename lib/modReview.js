// /lib/modReview.js

const scannerConfig = require('./scannerConfig');
const { scanImage } = require('./scan');

/**
 * Handle moderator reactions to flagged messages.
 *
 * @param {MessageReaction} reaction Reaction object
 * @param {User} user User who reacted
 * @param {Client} client Discord client
 * @returns {Promise<boolean>} Whether the reaction was handled
 */
async function processFlaggedReview(reaction, user, client) {
    const emoji = reaction.emoji.name;
    const message = reaction.message;

    if (client.flaggedReviews && client.flaggedReviews.has(message.id)) {
        const review = client.flaggedReviews.get(message.id);
        const guild = message.guild;
        let member;
        try {
            member = await guild.members.fetch(user.id);
        } catch {
            return true;
        }

        const cfg = scannerConfig.get();
        const isMod = (cfg.moderatorRoleId && member.roles.cache.has(cfg.moderatorRoleId)) ||
            member.permissions.has('ManageMessages');
        if (!isMod) return true;

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
        return true;
    }
    return false;
}

module.exports = { processFlaggedReview };

