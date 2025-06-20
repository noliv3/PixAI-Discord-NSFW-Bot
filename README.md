# PixAI Discord NSFW Bot – Moderator Guide

This bot manages image events in your Discord server and automatically scans uploads for NSFW content. Moderators can start contests, review flagged images and export the results.

---

## Quick start

1. **Install Node.js 18+** on the machine running the bot.
2. Run `npm install` once to download dependencies.
3. Copy `scanner-config.example.json` to `scanner-config.json` and fill in your values.
4. Place your bot token in `token.json`.
5. Start the bot with `node index.js`.

---

## Running events

- `!start <duration>` – Start an event in the current channel.
- `!start <name> <duration> <max>` – Create a new channel and start an event with an upload limit per user.
- `!extend <name> <±h>` – Extend or shorten an active event.
- `!stop` – End the event and post the result list.
- `!eventstats` – Show currently running events.
- `!zip <event> [topX]` – Upload a ZIP file with the submissions (requires FTP access).

Participants can vote on submissions with any emoji except the moderator controls listed below. Votes are counted and saved in the filename (`_rateX_`).

---

## Handling flagged content

Uploads are scanned using the configured API. Content that meets the flag threshold is posted to your moderation channel. React on that message to take action:

- `✅` – approve and keep the image.
- `❌` – delete the original post.
- `⚠️` – warn the user via DM.
- `🔁` – rescan and display the detected tags.

Users can also trigger a public scan by reacting with `?` to a message containing an attachment.

Invalid image links encountered during checks are written to `logs/invalid_urls.log` for later review.

---

## Moderation tips

- Make sure the bot role has permission to manage messages in event channels.
- Adjust the tag filters or scan thresholds with `!filter` and `!setscan` if too much content is flagged or deleted.
- Use `!r` to restart the bot if it becomes unresponsive (bot owner only).

---

## License

MIT – see [LICENSE](LICENSE)
