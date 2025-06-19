# PixAI Discord NSFW Bot

Ein modularer Discord-Bot für Events, Bildbewertung, NSFW-Erkennung und automatisierte Moderation – powered by einer lokalen Bildscanner-API.

---

## 🔧 Features

- 📁 Automatisches Event-Handling mit Bild-Uploads
- 🧠 NSFW-Analyse & Tag-Bewertung über lokale Scanner-API
- 🔁 Voting-System via Reactions (`⭐`, `✅`, `❌`, `🔁`)
- 📊 Live-Statistiken (`!eventstats`)
- 🕒 Erweiterbare Laufzeit (`!extend`)
- 📆 ZIP-Export der besten Einreichungen (`!zip`)
- 🤖 PixAI-Image-Generation (`!pixai <prompt>`)

---

## 📂 Projektstruktur

```
discord/
├── index.js
├── token.json                     # ← lokal behalten (nicht commiten)
├── scanner-config.json            # ← sensible Daten lokal
├── scanner-config.example.json    # ← Platzhalter für GitHub
├── commands/
│   └── *.js                    # Bot-Kommandos (!start, !stop, !extend ...)
├── events/
│   └── *.js                    # Discord-Eventhandler (Reactions, Messages)
├── lib/
│   └── *.js                    # Hilfsfunktionen: Scan, Filter, Stats, etc.
├── config/
│   └── ftp.json                # FTP-Upload (lokal behalten)
└── event_files/                # gespeicherte Uploads (ignored)
```

---

## 🚀 Schnellstart

### 🛠️ Voraussetzungen

- Node.js ≥ 18
- Lokale Bildscanner-API (z. B. `scanner_api.py`)

### 📦 Installation

```bash
npm install
```

### 🧩 Konfiguration

**Beispiel:** `scanner-config.json`

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

### 🔒 Sicherheit

- `token.json` enthält den Bot-Token – **niemals committen!**
- `scanner-config.json` ebenfalls vertraulich

---

## 🖼️ PixAI Integration (optional)

```bash
export PIXAI_API_KEY=dein_schlüssel
!pixai A cat wearing sunglasses
```

---

## 📚 Kommandos

| Befehl                        | Beschreibung                             |
| ----------------------------- | ---------------------------------------- |
| `!start <dauer>`              | Starte Event im aktuellen Channel        |
| `!start <name> <dauer> <max>` | Starte Event mit Channel-Erstellung      |
| `!extend <name> <±h>`         | Verlängert oder verkürzt Eventzeit       |
| `!stop`                       | Beendet Event und erstellt Ergebnisliste |
| `!eventstats`                 | Zeigt aktive Events und Status           |
| `!setscan <flag> <delete>`    | Passe Scan-Schwellen an                  |
| `!zip <event> [topX]`         | Exportiere Eventbilder als ZIP           |
| `!pixai <prompt>`             | Erzeuge KI-Bild via PixAI (optional)     |
| `!r`                          | Neustart des Bots (nur Owner)            |

---

## 🧠 Moderationslogik

- **Filter Level 0:** sofortige Löschung
- **Level 1–2:** Flagging für Mod-Review
- **Level 3:** kein Eingriff
- Reviews steuerbar per ✅, ❌, 🔁

---

## ✅ Lizenz

MIT – siehe [LICENSE](LICENSE)

