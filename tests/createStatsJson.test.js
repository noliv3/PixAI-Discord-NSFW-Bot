jest.mock('fs/promises', () => ({
  writeFile: jest.fn()
}));

const path = require('path');
let fs;

describe('createStatsJson', () => {
  beforeEach(() => {
    jest.resetModules();
    fs = require('fs/promises');
    fs.writeFile.mockClear();
  });

  test('writes stats json and returns statistics', async () => {
    const createStatsJson = require('../lib/createStatsJson');
    const event = {
      name: 'testevent',
      start_time: 100,
      end_time: 200,
      folder: '/tmp',
      entries: [
        { messageId: 'm1', userId: 'u1', filename: 'f1.jpg', reactionUsers: new Set(['a', 'b']) },
        { messageId: 'm2', userId: 'u2', filename: 'f2.jpg', reactionUsers: new Set(['c']) }
      ],
      users: new Set(['u1', 'u2'])
    };

    const stats = await createStatsJson(event, {});

    const expected = {
      name: 'testevent',
      start_time: 100,
      end_time: 200,
      entry_count: 2,
      participants: 2,
      total_votes: 3,
      top_entries: [
        { filename: 'f1.jpg', user_id: 'u1', message_id: 'm1', votes: 2 },
        { filename: 'f2.jpg', user_id: 'u2', message_id: 'm2', votes: 1 }
      ],
      entries: [
        { filename: 'f1.jpg', user_id: 'u1', message_id: 'm1', votes: 2 },
        { filename: 'f2.jpg', user_id: 'u2', message_id: 'm2', votes: 1 }
      ]
    };

    expect(stats).toEqual(expected);
    expect(fs.writeFile).toHaveBeenCalledTimes(1);
    const [filePath, data] = fs.writeFile.mock.calls[0];
    expect(filePath).toBe(path.join('/tmp', 'testevent.json'));
    expect(JSON.parse(data)).toEqual(expected);
  });
});
