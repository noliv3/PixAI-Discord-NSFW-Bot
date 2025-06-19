const axios = require('axios');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { exec } = require('child_process');

/**
 * Download a video and extract specific frames.
 *
 * @param {string} videoUrl URL of the video file.
 * @param {number[]} frameNumbers Frame indices to extract.
 * @returns {Promise<Buffer[]>} Buffers for each extracted frame in order.
 */
async function extractFrames(videoUrl, frameNumbers) {
    const resp = await axios.get(videoUrl, { responseType: 'arraybuffer' });
    const tmpVideo = path.join(os.tmpdir(), `vid_${Date.now()}_${Math.random().toString(36).slice(2)}.tmp`);
    await fs.writeFile(tmpVideo, resp.data);
    const results = [];

    for (const frame of frameNumbers) {
        const tmpFrame = path.join(os.tmpdir(), `frame_${Date.now()}_${frame}.jpg`);
        const cmd = `ffmpeg -y -i "${tmpVideo}" -vf "select=eq(n\\,${frame})" -vframes 1 "${tmpFrame}"`;
        await new Promise((resolve, reject) => {
            exec(cmd, (err) => err ? reject(err) : resolve());
        });
        results.push(await fs.readFile(tmpFrame));
        await fs.unlink(tmpFrame);
    }

    await fs.unlink(tmpVideo);
    return results;
}

module.exports = { extractFrames };
