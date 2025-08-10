import useTutorialListsStore from '@/store/tutorials/tutorialListsStore';
import useAuthStore from '@/store/auth/authStore';
import * as tutorialService from '../../services/tutorialService';
import Router from 'next/router';

jest.mock('next/router', () => ({ push: jest.fn() }));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('../../services/tutorialService', () => ({
  getMyTutorialWishlist: jest.fn().mockResolvedValue([]),
  getMyTutorialFavorites: jest.fn().mockResolvedValue([]),
  addTutorialToWishlist: jest.fn().mockResolvedValue({}),
  removeTutorialFromWishlist: jest.fn().mockResolvedValue({}),
  addTutorialToFavorites: jest.fn().mockResolvedValue({}),
  removeTutorialFromFavorites: jest.fn().mockResolvedValue({}),
}));

beforeEach(() => {
  useTutorialListsStore.setState({ wishlistIds: [], favoriteIds: [] });
  useAuthStore.setState({ user: { id: 1, role: 'student' } });
  jest.clearAllMocks();
});

test('toggleWishlist updates state after service calls', async () => {
  const { toggleWishlist } = useTutorialListsStore.getState();
  await toggleWishlist(5);
  expect(tutorialService.addTutorialToWishlist).toHaveBeenCalledWith(5);
  expect(useTutorialListsStore.getState().wishlistIds).toContain(5);
  await toggleWishlist(5);
  expect(tutorialService.removeTutorialFromWishlist).toHaveBeenCalledWith(5);
  expect(useTutorialListsStore.getState().wishlistIds).not.toContain(5);
});

test('toggleFavorite updates state after service calls', async () => {
  const { toggleFavorite } = useTutorialListsStore.getState();
  await toggleFavorite(7);
  expect(tutorialService.addTutorialToFavorites).toHaveBeenCalledWith(7);
  expect(useTutorialListsStore.getState().favoriteIds).toContain(7);
  await toggleFavorite(7);
  expect(tutorialService.removeTutorialFromFavorites).toHaveBeenCalledWith(7);
  expect(useTutorialListsStore.getState().favoriteIds).not.toContain(7);
});

test('redirects unauthenticated users to login', async () => {
  useAuthStore.setState({ user: null });
  const { toggleWishlist } = useTutorialListsStore.getState();
  await toggleWishlist(1);
  expect(Router.push).toHaveBeenCalledWith('/auth/login');
});
