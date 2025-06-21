// /events/messageReactionAdd.js

const { handleReactionAdd } = require('../lib/handleReactionAdd');

module.exports = {
    name: 'messageReactionAdd',
    async execute(reaction, user, client) {
        try {
            if (reaction.partial) await reaction.fetch();
            if (reaction.message.partial) await reaction.message.fetch();
            await handleReactionAdd(reaction, user, client);
        } catch (err) {
            console.error('[messageReactionAdd] Error:', err);
        }
    }
};
