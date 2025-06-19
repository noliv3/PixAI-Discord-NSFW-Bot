jest.mock('fs', () => ({
  renameSync: jest.fn()
}));

const { addVote, removeVote } = require('../lib/voteUtils');
const fs = require('fs');

describe('voteUtils', () => {
  test('addVote and removeVote update filename', () => {
    const entry = { filename: 'event_user_msg_rate0_ts.jpg', reactionUsers: new Set() };
    const event = { folder: '/tmp' };

    addVote(entry, 'u1', event);
    expect(fs.renameSync).toHaveBeenCalledWith(
      '/tmp/event_user_msg_rate0_ts.jpg',
      '/tmp/event_user_msg_rate1_ts.jpg'
    );
    expect(entry.filename).toBe('event_user_msg_rate1_ts.jpg');

    removeVote(entry, 'u1', event);
    expect(fs.renameSync).toHaveBeenCalledWith(
      '/tmp/event_user_msg_rate1_ts.jpg',
      '/tmp/event_user_msg_rate0_ts.jpg'
    );
    expect(entry.filename).toBe('event_user_msg_rate0_ts.jpg');
  });
});
