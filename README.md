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
├── package.json
├── token.json
├── scanner-config.json
├── commands/
│   ├── eventstats.js
│   ├── extend.js
│   ├── pixai.js
│   ├── r.js
│   ├── setscan.js
│   ├── start.js
│   ├── stop.js
│   └── zip.js
├── events/
│   ├── messageCreate.js
│   ├── messageDelete.js
│   ├── messageReactionAdd.js
│   └── messageReactionRemove.js
├── lib/
│   ├── createStatsJson.js
│   ├── scan.js
│   └── scannerConfig.js
├── config/
│   └── ftp.json
└── event_files/
    └── <eventname>/
        └── <eventname>_<user>_<msgid>_rateX_<date>.jpg
```

## Commands

- `!start <duration>` – Start an event in the current channel
- `!start <name> <duration> <max>` – Create a new channel and start the event
- `!stop` – End the event and generate JSON with top list
- `!extend <eventname> <+/-hours>` – Extend or shorten an event
- `!eventstats` – Show all running events and remaining time
- `!r` – Restart the bot (admin only)
- `!setscan <flag> <delete>` – Update scan thresholds at runtime
- `!pixai <prompt>` – Generate an image using PixAI
- `!zip <eventname> [topX]` – Archive event submissions as ZIP

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
4. Edit `discord/scanner-config.json` to set the scanner API URL and
   adjust default thresholds:
   ```json
   {
       "scannerApiUrl": "https://scanner.example.com/scan?token=YOUR_TOKEN",
       "flagThreshold": 0.5,
       "deleteThreshold": 0.9,
       "moderatorRoleId": "MOD_ROLE_ID_HERE",
       "moderatorChannelId": "MOD_CHANNEL_ID_HERE"
   }
   ```

## Scanner Setup

The bot uses an external image scanner to check uploaded files.
Create an account on the scanner service or ask the bot administrator
for an access token. Add the service URL to `scannerApiUrl` in
`discord/scanner-config.json` and optionally set `authHeader` and
`multipartField` when the API expects them:

```json
{
    "scannerApiUrl": "https://scanner.example.com/scan",
    "authHeader": "Bearer YOUR_TOKEN",
    "multipartField": "image"
}
```

If `scannerApiUrl` is empty, uploads will **not** be scanned and the console
will print a warning.


## Running the Bot

Launch the bot with Node or use a process manager such as **pm2**:

```bash
node discord/index.js
# or
pm2 start discord/index.js --name event-bot
```

Make sure the bot has permission to read messages and add reactions in the channels where events are held. Votes from the same user count only once per image, and event folders are created automatically.

## Scanner Configuration

Image scanning settings, including the API URL, optional authorization header,
multipart field, and thresholds, are read from
`discord/scanner-config.json`. Adjust the values manually or use the `!setscan`
command while the bot is running.

Add a `?` (or `❓`) reaction to any message with image attachments to scan it. The bot responds with the top tags and marks the result with `✅` when safe or `❗` when it requires review.

When a scan exceeds the configured thresholds, a notice is sent to the configured moderator channel. Moderators can react with **✅** to approve, **❌** to delete the offending message, or **🔁** to rescan the image.

## PixAI Integration

Use `!pixai <prompt>` to generate an image via the PixAI API. Create an account on [PixAI](https://pixai.art/) and obtain an API key. Set it before starting the bot:

```bash
export PIXAI_API_KEY=YOUR_PIXAI_KEY
```

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on reporting issues, making changes, and submitting pull requests. A short summary of the code of conduct can be found in [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
