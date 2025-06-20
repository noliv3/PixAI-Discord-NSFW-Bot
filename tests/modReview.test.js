const { processFlaggedReview } = require('../lib/modReview');

function createMockReaction() {
  const reply = jest.fn();
  const member = {
    roles: { cache: new Map() },
    permissions: { has: jest.fn().mockReturnValue(true) }
  };
  const guild = { members: { fetch: jest.fn().mockResolvedValue(member) } };
  const message = { id: 'sum', guild, reply };
  const reaction = { emoji: { name: '⚠️' }, message };
  return { reaction, reply, guild };
}

test('processFlaggedReview warns user via DM', async () => {
  const { reaction, reply } = createMockReaction();
  const client = {
    flaggedReviews: new Map([
      ['sum', {
        flaggedMessageId: 'orig',
        channelId: 'chan',
        attachmentUrl: 'url',
        userId: 'target'
      }]
    ]),
    users: { fetch: jest.fn().mockResolvedValue({ send: jest.fn(), tag: 'user#1' }) },
    channels: { fetch: jest.fn() }
  };
  const user = { id: 'mod', tag: 'mod#1' };

  const handled = await processFlaggedReview(reaction, user, client);

  expect(handled).toBe(true);
  expect(client.users.fetch).toHaveBeenCalledWith('target');
  const fetched = await client.users.fetch.mock.results[0].value;
  expect(fetched.send).toHaveBeenCalledWith('This picture violates our rules and has been flagged by the moderators.');
  expect(reply).toHaveBeenCalledWith('Warned user#1');
  expect(client.flaggedReviews.size).toBe(0);
});
