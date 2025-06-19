describe('scanCache', () => {
  const TTL = 600000; // must match value in scanCache.js

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('markScanned and isRecentlyScanned with timers', () => {
    const cache = require('../lib/scanCache');

    cache.markScanned('msg');

    jest.advanceTimersByTime(TTL - 1);
    expect(cache.isRecentlyScanned('msg')).toBe(true);

    jest.advanceTimersByTime(1);
    expect(cache.isRecentlyScanned('msg')).toBe(false);
  });
});
