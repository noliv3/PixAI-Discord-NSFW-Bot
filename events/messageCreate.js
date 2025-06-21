// /events/messageCreate.js

const { handleMessageCreate } = require('../lib/handleMessageCreate');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        try {
            await handleMessageCreate(message, client);
        } catch (err) {
            console.error('[messageCreate] Error:', err);
        }
    }
};
