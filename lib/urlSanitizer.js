const axios = require('axios');

/**
 * Prüft, ob eine gegebene URL ein Bild ist (per Content-Type Header).
 * 
 * @param {string} url - Die zu prüfende URL
 * @returns {Promise<boolean>} true wenn Content-Type ein Bildtyp ist
 */
async function isImageUrl(url) {
    try {
        const response = await axios.head(url, {
            timeout: 3000,
            maxRedirects: 2,
            validateStatus: status => status < 400
        });

        const type = response.headers['content-type'];
        return typeof type === 'string' && type.startsWith('image/');
    } catch (err) {
        console.warn('URL check failed:', url, err.message);
        return false;
    }
}

module.exports = { isImageUrl };
