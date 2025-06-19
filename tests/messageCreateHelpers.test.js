const { isImage, isVideo, isMedia } = require('../events/messageCreate');

describe('messageCreate helpers', () => {
  test('isImage detects image extensions', () => {
    expect(isImage({ url: 'http://a/b.JPG' })).toBe(true);
    expect(isImage({ url: 'file.png' })).toBe(true);
    expect(isImage({ url: 'file.txt' })).toBe(false);
  });

  test('isVideo detects video extensions', () => {
    expect(isVideo({ url: 'movie.MP4' })).toBe(true);
    expect(isVideo({ url: 'clip.webm' })).toBe(true);
    expect(isVideo({ url: 'file.png' })).toBe(false);
  });

  test('isMedia combines image and video checks', () => {
    expect(isMedia({ url: 'pic.gif' })).toBe(true);
    expect(isMedia({ url: 'video.avi' })).toBe(true);
    expect(isMedia({ url: 'doc.pdf' })).toBe(false);
  });
});
