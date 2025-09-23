import useNotificationStore from '@/store/notifications/notificationStore';
import { getNotifications } from '@/services/notificationService';

jest.mock('@/services/notificationService', () => ({
  getNotifications: jest.fn(),
  markNotificationAsRead: jest.fn(),
  deleteNotification: jest.fn(),
}));

const resetStore = () => {
  useNotificationStore.setState({ items: [], loading: false, poller: null });
};

describe('notificationStore.fetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['non-array object', { data: [] }],
  ])('treats %s responses as empty arrays', async (_, response) => {
    getNotifications.mockResolvedValueOnce(response);

    await expect(useNotificationStore.getState().fetch()).resolves.toBeUndefined();

    expect(useNotificationStore.getState().items).toEqual([]);
    expect(useNotificationStore.getState().loading).toBe(false);
  });
});
