# AGENTS.md

## Globale Speicher

client.activeEvents = Map<channelId, EventData>

### EventData
```
{
  name: string,
  start_time: number,
  end_time: number,
  folder: string,
  entries: Array<{
    messageId: string,
    userId: string,
    filename: string,
    reactionUsers: Set<string>
  }>,
  users: Set<string>,
  reactions: Map<string, unknown>,
  remainingTimeout: Timeout,
  channel_id: string,
  max_entries: number
}
```

### Systemverhalten

- `messageCreate.js` erkennt Uploads und speichert Dateien
- `messageReactionAdd.js` bewertet Dateien anhand der Benutzerreaktion (einmalig)
- `messageReactionRemove.js` entfernt Bewertungen und passt Dateien an
- `createStatsJson.js` erzeugt JSON-Statistiken
- `extend.js` passt `end_time` und Timeout dynamisch an

---

## TODOs / Geplant

- Moderationsbefehle zur Abstimmungsübersicht
- Export als ZIP mit Markdown-Report
- Mehrsprachigkeit (Lokalisierung)
- Client-Zeitzonenabgleich für Benutzeranzeige
- Logging für Reactions & Votes (Audit)

---

**Status: Funktionstüchtig (Stand: Juni 2025)**
