# PixAI Discord NSFW Bot

A modular Discord bot for image events, rating, NSFW detection and automated moderation. It communicates with a local image scanner API.

---

## Features

- 📁 Automatic event handling with image uploads
- 🧠 NSFW analysis and tag scoring via a local scanner API
- Voting with reactions (`⭐`, `👍`, `👎`, `❌`)
- 📊 Live statistics using `!eventstats`
- 🕒 Extend event duration with `!extend`
- 📆 ZIP export of top submissions (`!zip`)
- 📝 Invalid image links are logged to `logs/invalid_urls.log`

---

## Project layout

```
discord/
├── index.js
├── token.json                     # keep locally (do not commit)
├── scanner-config.json            # local secrets
├── scanner-config.example.json    # placeholder for GitHub
├── commands/                      # bot commands (!start, !stop, !extend ...)
│   └── *.js
├── events/                        # Discord event handlers
│   └── *.js
├── lib/                           # helpers: scan, filter, stats, etc.
│   └── *.js
├── config/
│   └── ftp.json                   # FTP upload config (local only)
└── event_files/                   # stored uploads (ignored)
```

---

## Quick start

### Requirements

- Node.js ≥ 18
- Local image scanner API (e.g. `scanner_api.py`)

### Installation

```bash
npm install
```

### Configuration

Example `scanner-config.json`:

```json
{
  "scannerApiUrl": "http://localhost:8000/check",
  "authHeader": "API_TOKEN_IF_EXISTS",
  "multipartField": "image",
  "flagThreshold": 0.5,
  "deleteThreshold": 0.9,
  "moderatorRoleId": "MOD_ROLE_ID",
  "moderatorChannelId": "MOD_LOG_CHANNEL",
  "tagFilters": {
    "0": ["cp", "loli", "rape", "shota", "sex", "pussy", "covered_nipples", "nude"],
    "1": ["sex", "pussy", "nipples", "nude", "ass_visible_through_thighs", "blood"],
    "2": ["cleavage", "underwear", "cameltoe"],
    "3": ["smile", "flower", "scenery"]
  }
}
```

### Security

- `token.json` contains the bot token – **never commit it**
- `scanner-config.json` is also confidential

---

## PixAI integration (optional)

```bash
export PIXAI_API_KEY=your_key
!pixai A cat wearing sunglasses
```

---

## Commands

| Command                       | Description                                |
| ----------------------------- | ------------------------------------------ |
| `!start <duration>`           | Start an event in the current channel      |
| `!start <name> <duration> <max>` | Create a channel and start an event        |
| `!extend <name> <±h>`         | Extend or reduce event duration            |
| `!stop`                       | End an event and create the result list    |
| `!eventstats`                 | Show active events and status              |
| `!setscan <flag> <delete>`    | Adjust scanning thresholds                 |
| `!zip <event> [topX]`         | Export event images as ZIP                 |
| `!pixai <prompt>`             | Generate AI image via PixAI (optional)     |
| `!r`                          | Restart the bot (owner only)               |

---

## Moderation logic

- **Filter level 0:** delete immediately
- **Level 1–2:** flag for moderator review
- **Level 3:** no action
- Reviews can be managed with 👍, 👎, ❌, ⚠️

---

## License

MIT – see [LICENSE](LICENSE)
