# Developer Guide

This document explains how the PixAI Discord NSFW Bot is structured and how to extend it.

---

## Project layout

```
./index.js               # bot entry point
./commands/              # command handlers
./events/                # Discord event listeners
./lib/                   # helper modules
./config/ftp.json        # FTP upload settings
./scanner-config.json    # API and moderation settings (local)
./event_files/           # stored uploads (git ignored)
```

## Installation

1. Install **Node.js 18+**.
2. Run `npm install` to fetch dependencies.
3. Copy `scanner-config.example.json` to `scanner-config.json` and adjust.
4. Create `token.json` with `{ "token": "YOUR_DISCORD_TOKEN" }`.

Run the bot with:

```bash
node index.js
```

## Testing

Unit tests are written with Jest. Execute them via:

```bash
npm test
```

## Extending commands

Add new command files in `commands/` exporting an object with `name` and an `execute` function. Files in this folder are loaded automatically at startup.

```js
module.exports = {
  name: 'mycommand',
  async execute(message, client, args) {
    // your logic here
  }
};
```

## Event system

Running events are stored in `client.activeEvents`. See `agents.md` for details on the `EventData` structure and lifecycle. Images are saved under `event_files/<event_name>/` and votes are tracked by renaming the files.

Statistics are written by `lib/createStatsJson.js` when an event ends.

## Contribution

Feel free to open issues or pull requests. Make sure tests pass before submitting.

---

MIT License
