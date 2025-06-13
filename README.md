# Discord Event-Bot

A modular bot for running community events with automatic channel handling, uploads, reactions, voting, and statistic generation.

## Features

- Start events in the current channel or create a dedicated one
- Upload images with a user-specific limit
- Automatic voting via reactions
- Live statistics with `!eventstats`
- Extend or shorten running events
- Result generation as JSON
- Optional ZIP export of submissions

## Folder Structure

```
discord/
├── index.js
├── token.json
├── package.json
│
├── commands/
│   ├── start.js / startEvent.js
│   ├── stop.js
│   ├── extend.js
│   ├── eventstats.js
│   ├── r.js
│   └── zip.js (optional)
│
├── events/
│   ├── messageCreate.js
│   ├── messageReactionAdd.js
│   ├── messageReactionRemove.js
│
├── lib/
│   └── createStatsJson.js
│
├── events/ (storage)
│   └── <eventname>/
│       └── <eventname>_<user>_<msgid>_rateX_<date>.jpg
```

## Commands

- `!start <duration>` – Start an event in the current channel
- `!start <name> <duration> <max>` – Create a new channel and start the event
- `!stop` – End the event and generate JSON with top list
- `!extend <eventname> <+/-hours>` – Extend or shorten an event
- `!eventstats` – Show all running events and remaining time
- `!r` – Restart the bot (admin only)

## Installation

1. Install [Node.js](https://nodejs.org/) (v18 or later recommended).
2. Clone this repository and install dependencies:
   ```bash
   npm install discord.js axios adm-zip pm2
   ```
3. Create `discord/token.json` with your bot token:
   ```json
   { "token": "YOUR_BOT_TOKEN" }
   ```

## Running the Bot

Launch the bot with Node or use a process manager such as **pm2**:

```bash
node discord/index.js
# or
pm2 start discord/index.js --name event-bot
```

Make sure the bot has permission to read messages and add reactions in the channels where events are held. Votes from the same user count only once per image, and event folders are created automatically.
