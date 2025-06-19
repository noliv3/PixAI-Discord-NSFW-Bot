// /lib/publicScanHandler.js

const { scanImage } = require('./scan');
const { evaluateTags, getFilters } = require('./scannerFilter');

// Zwischenspeicher für kürzlich geprüfte Nachrichten
const scanTimestamps = new Map();
const TTL = 600 * 1000; // 10 Minuten
const MAX_ENTRIES = 1000;

// Bereinigung der Cache-Einträge
function cleanupCache() {
    const now = Date.now();
    for (const [id, ts] of scanTimestamps.entries()) {
        if (now - ts > TTL) {
            scanTimestamps.delete(id);
        }
    }
    if (scanTimestamps.size > MAX_ENTRIES) {
        const sorted = [...scanTimestamps.entries()].sort((a, b) => a[1] - b[1]);
        for (let i = 0; i < sorted.length - MAX_ENTRIES; i++) {
            scanTimestamps.delete(sorted[i][0]);
        }
    }
}

function alreadyScanned(messageId) {
    const ts = scanTimestamps.get(messageId);
    const now = Date.now();
    if (ts && now - ts < TTL) return true;
    scanTimestamps.set(messageId, now);
    cleanupCache();
    return false;
}

// Tags aus Scan-Ergebnis extrahieren
function extractTags(data) {
    const modules = {};
    for (const [key, value] of Object.entries(data)) {
        if (key.startsWith('modules.')) {
            modules[key.slice(8)] = value;
        }
    }

    const rawTags =
        modules.deepdanbooru_tags?.tags ||
        modules.tagging?.tags ||
        modules.image_storage?.metadata?.danbooru_tags ||
        modules.image_storage?.metadata?.tags ||
        [];

    const tags = Array.isArray(rawTags) ? rawTags : [];
    return tags
        .map(t => typeof t === 'string' ? t : (t.label || t.name || t.tag))
        .filter(t => !!t && t.toLowerCase() !== 'rating:safe');
}

// Darstellung der Bewertung für User-Scan
function formatDisplay(level, matched, tags) {
    let headline = '🟢 Safe';
    if (level === 1) headline = '🔞 Explicit';
    else if (level === 2) headline = '⚠️ Questionable';

    let conflict = '';
    if (matched.length > 0) {
        const label = level === 1 ? 'Critical tags' : (level === 2 ? 'Questionable conflict' : '');
        if (label) {
            conflict = `**${label}:** ${matched.map(t => `**${t}**`).join(', ')}`;
        }
    }

    const lowerTags = tags.map(t => t.toLowerCase());
    const tagged = tags.slice(0, 10).map(t =>
        matched.includes(t.toLowerCase()) ? `**${t}**` : t
    ).join(', ') || '—';

    return [headline, conflict, `**Tags:** ${tagged}`]
        .filter(Boolean)
        .join('\n');
}

// Hauptfunktion
async function handlePublicScan(message, attachment, client) {
    if (alreadyScanned(message.id)) return;

    const data = await scanImage(attachment.url);
    if (!data) {
        await message.channel.send('Image scan failed.');
        return;
    }

    const tags = extractTags(data);
    const evaluation = evaluateTags(tags.map(t => t.toLowerCase()));
    const output = formatDisplay(evaluation.level, evaluation.matched, tags);

    await message.channel.send(output);
}

module.exports = { handlePublicScan };
