const { removeVote } = require('../lib/voteUtils');

module.exports = {
    name: 'messageReactionRemove',
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

        const channelId = message.channel.id;
        const event = client.activeEvents && client.activeEvents.get(channelId);
        if (event) {
            const entry = event.entries.find(e => e.messageId === message.id);
            if (entry && !['?', '❓', '✅', '❌', '🔁'].includes(emoji)) {
                removeVote(entry, user.id, event);
            }
        }
    }
};
