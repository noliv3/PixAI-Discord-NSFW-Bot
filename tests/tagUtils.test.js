const { extractTags, highlightTags } = require('../lib/tagUtils');

describe('tagUtils', () => {
  test('extractTags returns tag names without rating:safe', () => {
    const data = {
      'modules.deepdanbooru_tags': { tags: ['cat', 'rating:safe', { label: 'dog' }] }
    };
    const tags = extractTags(data);
    expect(tags).toEqual(['cat', 'dog']);
  });

  test('highlightTags highlights matching tags', () => {
    const tags = ['cat', 'dog', 'bird'];
    const result = highlightTags(tags, ['dog']);
    expect(result).toBe('cat, **dog**, bird');
  });
});
