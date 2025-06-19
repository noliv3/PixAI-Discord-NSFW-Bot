// /lib/tagUtils.js

/**
 * Extract tag strings from a scanning result.
 *
 * @param {Object} data Scan result JSON
 * @returns {string[]} Array of tag names
 */
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

/**
 * Return a comma separated list of tags with matched tags highlighted.
 *
 * @param {string[]} tags All tags
 * @param {string[]} match Tags to highlight
 * @returns {string} Formatted list
 */
function highlightTags(tags, match) {
    return tags
        .map(tag => match.includes(tag) ? `**${tag}**` : tag)
        .slice(0, 20)
        .join(', ') || '—';
}

module.exports = { extractTags, highlightTags };
