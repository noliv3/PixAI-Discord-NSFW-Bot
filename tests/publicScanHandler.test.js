const { formatDisplay } = require('../lib/publicScanHandler');

describe('publicScanHandler formatDisplay', () => {
  test('safe output with no matches', () => {
    const out = formatDisplay(0, [], ['cat', 'dog']);
    expect(out).toBe('🟢 Safe\n**Tags:** cat, dog');
  });

  test('explicit output highlights matches', () => {
    const out = formatDisplay(1, ['nudity'], ['nudity', 'cat']);
    expect(out).toBe('🔞 Explicit\n**Critical tags:** **nudity**\n**Tags:** **nudity**, cat');
  });
});
