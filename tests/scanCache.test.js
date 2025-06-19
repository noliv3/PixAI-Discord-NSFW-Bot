const cache = require('../lib/scanCache');

describe('scanCache', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('markScanned and isRecentlyScanned', () => {
    const now = 1000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    cache.markScanned('msg');

    jest.spyOn(Date, 'now').mockReturnValue(now + 5000);
    expect(cache.isRecentlyScanned('msg')).toBe(true);

    jest.spyOn(Date, 'now').mockReturnValue(now + 600000 + 1);
    expect(cache.isRecentlyScanned('msg')).toBe(false);
  });
});
