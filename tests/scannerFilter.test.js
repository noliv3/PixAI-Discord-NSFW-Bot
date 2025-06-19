jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn()
}));

const path = require('path');
let fs = require('fs');
let filter;

const filePath = path.join(__dirname, '..', 'scanner-filters.json');

describe('scannerFilter', () => {
  beforeEach(() => {
    jest.resetModules();
    fs = require('fs');
    filter = require('../lib/scannerFilter');
    fs.writeFileSync.mockClear();
  });

  test('addFilter stores tag and writes to file', () => {
    filter.addFilter(1, 'explicit');
    expect(filter.getFilters()['1']).toContain('explicit');
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    const [p, data] = fs.writeFileSync.mock.calls[0];
    expect(p).toBe(filePath);
    expect(JSON.parse(data)['1']).toContain('explicit');
  });

  test('removeFilter deletes tag and writes to file', () => {
    filter.addFilter(2, 'bad');
    fs.writeFileSync.mockClear();
    filter.removeFilter(2, 'bad');
    expect(filter.getFilters()['2']).not.toContain('bad');
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    const [p, data] = fs.writeFileSync.mock.calls[0];
    expect(p).toBe(filePath);
    expect(JSON.parse(data)['2']).not.toContain('bad');
  });

  test('evaluateTags returns highest severity match', () => {
    filter.addFilter(0, 'banned');
    filter.addFilter(1, 'explicit');
    fs.writeFileSync.mockClear();
    const res = filter.evaluateTags(['explicit', 'banned']);
    expect(res).toEqual({ level: 0, matched: ['banned'] });
  });
});
