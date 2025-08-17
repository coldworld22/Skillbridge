jest.mock('../../../../config/database', () => {
  const replyRow = {
    id: 'r1',
    discussion_id: 'd1',
    user_id: 'u2',
    content: 'hello',
    file_url: null,
  };

  const insertReturning = jest.fn().mockResolvedValue([replyRow]);
  const insert = jest.fn(() => ({ returning: insertReturning }));

  const participantsDistinct = jest.fn().mockResolvedValue([
    { user_id: 'owner1' },
    { user_id: 'u3' },
  ]);
  const repliesWhereNot = jest.fn(() => ({ distinct: participantsDistinct }));
  const repliesWhere = jest.fn(() => ({ whereNot: repliesWhereNot }));

  let callCount = 0;
  const mockDb = jest.fn((table) => {
    if (table === 'community_replies') {
      callCount += 1;
      if (callCount === 1) {
        return { insert };
      }
      return { where: repliesWhere };
    }
    if (table === 'users') {
      return {
        where: jest.fn(() => ({
          first: jest.fn().mockResolvedValue({
            full_name: 'User 2',
            avatar_url: 'a.png',
          }),
        })),
      };
    }
    if (table === 'community_discussions') {
      return {
        where: jest.fn(() => ({
          first: jest.fn().mockResolvedValue({
            user_id: 'owner1',
            title: 'Disc Title',
          }),
        })),
      };
    }
    return {};
  });

  mockDb.fn = { now: jest.fn() };
  return mockDb;
});

jest.mock('../../contributorStats.util', () => ({ updateContributorStats: jest.fn(), }));
jest.mock('../../../notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));

const service = require('../public.service');
const notificationService = require('../../../notifications/notifications.service');

describe('createReply', () => {
  it('notifies discussion owner and participants', async () => {
    await service.createReply({
      discussion_id: 'd1',
      user_id: 'u2',
      content: 'hello',
    });

    expect(notificationService.createNotification).toHaveBeenCalledTimes(2);
    expect(notificationService.createNotification).toHaveBeenCalledWith({
      user_id: 'owner1',
      type: 'community',
      message: expect.stringContaining('Disc Title'),
    });
    expect(notificationService.createNotification).toHaveBeenCalledWith({
      user_id: 'u3',
      type: 'community',
      message: expect.stringContaining('Disc Title'),
    });
  });
});

