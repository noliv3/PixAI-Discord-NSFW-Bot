# AGENTS.md

## 📁 Globale Speicherstruktur

Der Bot speichert laufende Events zentral in:

```js
client.activeEvents = Map<string, EventData>
```

Dabei ist der Key die `channelId` des Event-Channels.

---

### Struktur: `EventData`

```ts
{
  name: string,                       // Eventname
  start_time: number,                // Zeitstempel (ms)
  end_time: number,                  // Zeitstempel (ms)
  folder: string,                    // Pfad zur Ablage der Bilder
  entries: Array<{
    messageId: string,
    userId: string,
    filename: string,
    reactionUsers: Set<string>
  }>,
  users: Set<string>,               // User mit gültigem Beitrag
  reactions: Map<string, unknown>,  // z.B. zur Livebewertung (nicht aktiv genutzt)
  remainingTimeout: Timeout,         // Event-Ende-Timer
  channel_id: string,               // redundante Channel-ID
  max_entries: number               // maximale Uploads pro User
}
```

---

## 🔄 Lebenszyklus eines Events

### ✅ Start (`!start`)

- Channel wird erstellt oder verwendet
- `EventData` wird in `client.activeEvents` eingetragen
- Ordner unter `event_files/` wird angelegt
- `setTimeout()` plant automatisches Ende

### 🔄 Upload / Beitrag

- Wird durch `messageCreate.js` erkannt
- Datei wird gespeichert (mit benanntem Dateistring)
- `entry` und `userId` werden ins Event eingetragen

### 🗳 Reaktion durch User

- Wird durch `messageReactionAdd.js` verfolgt
- Bei Reaktionen (außer Mod-Emojis) wird Anzahl gezählt
- `filename` wird mit neuer `rateX`-Bewertung überschrieben

### 🚮 Reaktion entfernen

- Bei `messageReactionRemove.js`
- Bewertung wird zurückgesetzt (Dateiname aktualisiert)

### ❌ Stop (`!stop` oder Ablauf)

- Timer läuft ab oder Mod stoppt Event manuell
- JSON-Statistik wird mit `createStatsJson()` erstellt
- Top-Einträge werden ermittelt (für `!zip` oder Anzeige)
- Event wird aus `client.activeEvents` entfernt

---

## 📊 Event-Dateinamenstruktur

Beispiel:

```
eventname_userid_msgid_rate3_1687369182098.jpg
```

**Erklärt:**

- `eventname` = Event-Kennung
- `userid` = Discord-Nutzer
- `msgid` = Nachrichten-ID
- `rate3` = aktuelle Votes (zählt Reaktionen)
- Datum (ms) = eindeutiger Timestamp

---

## 🔧 Admin-Kommandos für Events

| Befehl                  | Funktion                 |
| ----------------------- | ------------------------ |
| `!start ...`            | Event starten            |
| `!extend <name> <+/-h>` | Zeit ändern              |
| `!stop`                 | Event beenden            |
| `!eventstats`           | Laufende Events anzeigen |
| `!zip <event> [topX]`   | ZIP-Export erstellen     |

---

## 🔒 Zugriff & Sicherheit

- Nur der Bot speichert in `client.activeEvents`
- Nur autorisierte Rollen können per Command Events steuern
- Keine Datenbank – 100% dateibasiert

---

## 📒 Erweiterungsmöglichkeiten

-

