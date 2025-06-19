// /lib/publicScanHandler.js

const { scanImage } = require('./scan');
const { evaluateTags } = require('./scannerFilter');
const { isRecentlyScanned, markScanned } = require('./scanCache');
const { extractTags } = require('./tagUtils');

// Prüft, ob eine Nachricht kürzlich gescannt wurde und setzt sie ggf. im Cache
function alreadyScanned(messageId) {
    if (isRecentlyScanned(messageId)) return true;
    markScanned(messageId);
    return false;
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
