const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { token } = require('./token.json');

let config = {};
try {
    config = require('./config.json');
} catch (err) {
    console.warn('config.json not found. Continuing with defaults.');
}

// Ensure folder for archived deletions exists
const deletedPath = path.join(__dirname, 'deleted');
if (!fs.existsSync(deletedPath)) {
    fs.mkdirSync(deletedPath, { recursive: true });
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction
    ]
});

// 🧠 Hier ist es richtig
client.activeEvents = new Map();

client.config = config;
client.flaggedReviews = new Map();

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command && command.name) {
        client.commands.set(command.name, command);
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event && event.name && typeof event.execute === 'function') {
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }
}

client.login(token);
