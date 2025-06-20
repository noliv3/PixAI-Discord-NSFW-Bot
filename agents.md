# AGENTS.md

## Global event storage

The bot keeps active events in a single map:

```js
client.activeEvents = Map<string, EventData>
```

The key is the `channelId` of the event channel.

---

### `EventData` structure

```ts
{
  name: string,                      // event name
  start_time: number,                // timestamp (ms)
  end_time: number,                  // timestamp (ms)
  folder: string,                    // path for stored images
  entries: Array<{
    messageId: string,
    userId: string,
    filename: string,
    reactionUsers: Set<string>
  }>,
  users: Set<string>,               // users with valid entries
  reactions: Map<string, unknown>,  // e.g. for live rating (currently unused)
  remainingTimeout: Timeout,        // timer for event end
  channel_id: string,               // redundant channel ID
  max_entries: number               // max uploads per user
}
```

---

## Event lifecycle

### ✅ Start (`!start`)

- Channel is created or reused
- `EventData` is stored in `client.activeEvents`
- Folder under `event_files/` is created
- `setTimeout()` schedules automatic end

### 🔄 Upload / submission

- Detected by `messageCreate.js`
- File is saved (with generated filename)
- `entry` and `userId` added to the event

### 🗳 Reaction from users

- Tracked via `messageReactionAdd.js`
- Reactions (except mod emojis) increase the count
- `filename` is overwritten with the new `rateX` value

### 🚮 Reaction removed

- Handled in `messageReactionRemove.js`
- Rating is reset (filename updated)

### ❌ Stop (`!stop` or timeout)

- Timer expires or moderator stops the event manually
- JSON stats generated with `createStatsJson()`
- Top entries determined for `!zip` or display
- Event is removed from `client.activeEvents`

---

## Event filename format

Example:

```
eventname_userid_msgid_rate3_1687369182098.jpg
```

**Explained:**

- `eventname` = event identifier
- `userid` = Discord user
- `msgid` = message ID
- `rate3` = current votes (reaction count)
- timestamp in ms

---

## Admin commands for events

| Command                 | Purpose                     |
| ----------------------- | --------------------------- |
| `!start ...`            | Start an event              |
| `!extend <name> <+/-h>` | Adjust event time           |
| `!stop`                 | Stop an event               |
| `!eventstats`           | List running events         |
| `!zip <event> [topX]`   | Create ZIP export           |

---

## Access & security

- Only the bot writes to `client.activeEvents`
- Only authorized roles may control events via commands
- No database – everything is file-based

---

## Possible extensions

-
