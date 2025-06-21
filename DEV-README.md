# PIXAI DISCORD NSFW BOT – DEVELOPER GUIDE

This document explains how to install, configure, and extend the PixAI NSFW moderation bot.

────────────────────────────────────────────
🧱 PROJECT STRUCTURE

./index.js                → Entry point  
./commands/               → All bot commands (e.g. !start, !stop, !zip)  
./events/                 → Discord event listeners (messages, reactions)  
./lib/                    → Core logic: scan, filter, cache, stats, etc.  
./config/ftp.json         → FTP export settings (optional)  
./scanner-config.json     → Main scan config (local only)  
./scanner-filters.json    → Filter levels for tags (editable by Mods)  
./event_files/            → Stored uploads per event (ignored in Git)  
./logs/invalid_urls.log   → Broken links are logged here  
token.json                → Your Discord bot token (DO NOT COMMIT)

────────────────────────────────────────────
🛠️ INSTALLATION

1. Install Node.js v18+

2. Run:
   npm install

3. Create `scanner-config.json`  
   Copy from `scanner-config.example.json` and edit:

{
  "scannerApiUrl": "http://localhost:8000/check",
  "authHeader": "YOUR_API_TOKEN",
  "flagThreshold": 0.5,
  "deleteThreshold": 0.9,
  "moderatorRoleId": "DISCORD_ROLE_ID",
  "moderatorChannelId": "MOD_CHANNEL_ID",
  "tagFilters": {
    "0": ["cp", "loli", "rape", "shota"],
    "1": ["sex", "pussy", "nipples"],
    "2": ["underwear", "cameltoe"],
    "3": ["smile", "flower"]
  }
}

4. Create `token.json`:

{
  "token": "YOUR_DISCORD_BOT_TOKEN"
}

5. Optional: set up `ftp.json` for ZIP export via FTP (see `/config/ftp.json`)

────────────────────────────────────────────
🚀 RUNNING THE BOT

Start it with:

node index.js

────────────────────────────────────────────
🧹 EXTENDING THE BOT

➤ Commands:
- Add a new `.js` file to `/commands/`
- Export `{ name, async execute(message, client, args) }`

Example:
module.exports = {
  name: 'hello',
  async execute(message, client, args) {
    message.reply('Hello!');
  }
};

➤ Events:
- Add `.js` to `/events/` with `{ name, once?, async execute(..., client) }`

────────────────────────────────────────────
🧠 SCAN LOGIC (OVERVIEW)

- All images (uploads or links) are scanned via `lib/scan.js`
- The bot sends the image to `/check` endpoint of the local scanner API
- Response includes `risk` + `tags`
- Logic uses `scannerFilter.js` → checks tags against `scanner-filters.json`
- Cache (`scanCache.js`) prevents duplicate scans

────────────────────────────────────────────

🔒 SECURITY NOTES

Never commit:
- `token.json`
- `scanner-config.json`
- `ftp.json`

`.gitignore` includes all sensitive/local files

────────────────────────────────────────────
📜 LICENSE

MIT – see LICENSE
