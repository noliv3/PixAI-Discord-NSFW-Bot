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

  test('extractTags handles other module formats', () => {
    const data = {
      'modules.tagging': { tags: [{ name: 'wolf' }, 'sheep', 'rating:safe'] }
    };
    const tags = extractTags(data);
    expect(tags).toEqual(['wolf', 'sheep']);
  });

  test('extractTags falls back to image_storage metadata', () => {
    const data = {
      'modules.image_storage': { metadata: { tags: [{ tag: 'tree' }, 'leaf', 'rating:safe'] } }
    };
    const tags = extractTags(data);
    expect(tags).toEqual(['tree', 'leaf']);
  });

  test('highlightTags returns dash for empty tag list', () => {
    const result = highlightTags([], ['x']);
    expect(result).toBe('—');
  });
});
