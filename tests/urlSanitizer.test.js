const nock = require('nock');
const { isImageUrl } = require('../lib/urlSanitizer');

const proxyVars = [
  'HTTP_PROXY',
  'http_proxy',
  'HTTPS_PROXY',
  'https_proxy',
  'npm_config_https_proxy',
  'npm_config_http_proxy',
  'npm_config_proxy',
  'no_proxy',
  'NO_PROXY',
  'YARN_HTTP_PROXY',
  'YARN_HTTPS_PROXY'
];

const savedEnv = {};

function clearProxies() {
  proxyVars.forEach(v => {
    savedEnv[v] = process.env[v];
    delete process.env[v];
  });
}

function restoreProxies() {
  proxyVars.forEach(v => {
    if (savedEnv[v] !== undefined) process.env[v] = savedEnv[v];
    else delete process.env[v];
  });
}

describe('isImageUrl', () => {
  beforeAll(() => {
    clearProxies();
  });

  afterAll(() => {
    restoreProxies();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  test('returns true for valid image URL using HEAD', async () => {
    nock('http://example.com')
      .head('/img.jpg')
      .reply(200, '', { 'Content-Type': 'image/jpeg' });

    const result = await isImageUrl('http://example.com/img.jpg');
    expect(result).toBe(true);
    expect(nock.isDone()).toBe(true);
  });

  test('returns true when HEAD fails but GET succeeds', async () => {
    nock('http://fallback.com')
      .head('/pic.png')
      .replyWithError('network error');

    nock('http://fallback.com')
      .get('/pic.png')
      .reply(200, '', { 'Content-Type': 'image/png' });

    const result = await isImageUrl('http://fallback.com/pic.png');
    expect(result).toBe(true);
    expect(nock.isDone()).toBe(true);
  });

  test('returns false for non-image URL', async () => {
    nock('http://bad.com')
      .head('/file.txt')
      .reply(200, '', { 'Content-Type': 'text/plain' });

    nock('http://bad.com')
      .get('/file.txt')
      .reply(200, 'nope', { 'Content-Type': 'text/plain' });

    const result = await isImageUrl('http://bad.com/file.txt');
    expect(result).toBe(false);
    expect(nock.isDone()).toBe(true);
  });
});
