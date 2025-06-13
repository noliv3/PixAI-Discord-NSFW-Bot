const axios = require('axios');
const FormData = require('form-data');
const scannerConfig = require('./scannerConfig');

/**
 * Download an image and send it to the configured scanner API.
 *
 * @param {string} url Image URL to scan.
 * @returns {Promise<Object|null>} Parsed scan result or null when unavailable.
 */
async function scanImage(url) {
    const { scannerApiUrl, authHeader, multipartField } = scannerConfig.get();
    if (!scannerApiUrl) {
        console.warn('scannerApiUrl is not set in scanner-config.json. Image scanning disabled.');
        return null;
    }
    try {
        const resp = await axios.get(url, { responseType: 'arraybuffer' });
        let data;
        let headers;
        if (multipartField) {
            const form = new FormData();
            form.append(multipartField, resp.data, 'image');
            data = form;
            headers = form.getHeaders();
        } else {
            data = resp.data;
            headers = { 'Content-Type': 'application/octet-stream' };
        }
        if (authHeader) headers['Authorization'] = authHeader;
        const scan = await axios.post(scannerApiUrl, data, { headers });
        return scan.data || null;
    } catch (err) {
        console.error('Image scan request failed:', err.message);
        return null;
    }
}

module.exports = { scanImage };
