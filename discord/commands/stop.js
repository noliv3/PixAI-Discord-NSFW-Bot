module.exports = {
    name: 'stop',
    description: 'Stop the current event (placeholder)',
    execute(message, args) {
        message.channel.send('Stop command executed.');
    }
};
