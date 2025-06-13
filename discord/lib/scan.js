const axios = require('axios');
const scannerConfig = require('./scannerConfig');

/**
 * Download an image and send it to the configured scanner API.
 *
 * @param {string} url Image URL to scan.
 * @returns {Promise<Object|null>} Parsed scan result or null when unavailable.
 */
async function scanImage(url) {
    const { scannerApiUrl } = scannerConfig.get();
    if (!scannerApiUrl) {
        console.warn('scannerApiUrl is not set in scanner-config.json. Image scanning disabled.');
        return null;
    }
    try {
        const resp = await axios.get(url, { responseType: 'arraybuffer' });
        const scan = await axios.post(scannerApiUrl, resp.data, {
            headers: { 'Content-Type': 'application/octet-stream' }
        });
        return scan.data || null;
    } catch (err) {
        console.error('Image scan request failed:', err.message);
        return null;
    }
}

module.exports = { scanImage };
