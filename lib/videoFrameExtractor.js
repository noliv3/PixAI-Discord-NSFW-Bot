const axios = require('axios');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { exec } = require('child_process');

// Limit how many ffmpeg processes can run at once to avoid heavy load
const MAX_FFMPEG_PROCS = 2;
let ffmpegActive = 0;
const ffmpegQueue = [];

function acquireFfmpeg() {
    return new Promise((resolve) => {
        if (ffmpegActive < MAX_FFMPEG_PROCS) {
            ffmpegActive++;
            resolve();
        } else {
            ffmpegQueue.push(resolve);
        }
    });
}

function releaseFfmpeg() {
    ffmpegActive--;
    if (ffmpegQueue.length > 0) {
        ffmpegActive++;
        ffmpegQueue.shift()();
    }
}

async function runFfmpeg(cmd) {
    await acquireFfmpeg();
    try {
        await new Promise((resolve, reject) => {
            exec(cmd, (err) => (err ? reject(err) : resolve()));
        });
    } finally {
        releaseFfmpeg();
    }
}

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
        await runFfmpeg(cmd);
        results.push(await fs.readFile(tmpFrame));
        await fs.unlink(tmpFrame);
    }

    await fs.unlink(tmpVideo);
    return results;
}

module.exports = { extractFrames };
