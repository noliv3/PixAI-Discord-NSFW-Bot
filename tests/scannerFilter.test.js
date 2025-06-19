jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn()
}));

const filter = require('../lib/scannerFilter');

describe('scannerFilter', () => {
  test('evaluateTags detects filtered tags', () => {
    filter.addFilter(1, 'explicit');
    const result = filter.evaluateTags(['explicit', 'other']);
    expect(result).toEqual({ level: 1, matched: ['explicit'] });
    filter.removeFilter(1, 'explicit');
  });
});
