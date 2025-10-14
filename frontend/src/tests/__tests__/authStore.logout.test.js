import useAuthStore from '@/store/auth/authStore';
import useLibraryStore from '@/store/libraryStore';

jest.mock('../../services/auth/authService', () => ({
  loginUser: jest.fn(),
  logoutUser: jest.fn(),
  registerUser: jest.fn(),
}));

jest.mock('../../services/profile/profileService', () => ({
  getFullProfile: jest.fn(),
}));

jest.mock('../../store/notifications/notificationStore', () => {
  const stopPolling = jest.fn();
  const fetch = jest.fn();
  const store = Object.assign(jest.fn(), {
    getState: () => ({ stopPolling, fetch }),
  });
  store.__stopPolling = stopPolling;
  store.__fetch = fetch;
  return {
    __esModule: true,
    default: store,
  };
});

jest.mock('../../store/messages/messageStore', () => {
  const stopPolling = jest.fn();
  const store = Object.assign(jest.fn(), {
    getState: () => ({ stopPolling }),
  });
  store.__stopPolling = stopPolling;
  return {
    __esModule: true,
    default: store,
  };
});

describe('authStore.logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    useAuthStore.setState({ accessToken: 'token', user: { id: 'user' }, onboarding: {} });
    useLibraryStore.setState({ books: [{ id: 'book-1' }], loading: false, error: null });
    localStorage.setItem('library-store', JSON.stringify({ state: { books: [{ id: 'book-1' }] } }));
  });

  test('clears library store state and persistence on logout', async () => {
    const clearSpy = jest.spyOn(useLibraryStore.getState(), 'clear');

    await useAuthStore.getState().logout(true);

    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(useLibraryStore.getState().books).toEqual([]);
    expect(localStorage.getItem('library-store')).toBeNull();

    clearSpy.mockRestore();
  });
});
