import { create } from 'zustand';
import Router from 'next/router';
import { toast } from 'react-toastify';
import useAuthStore from '@/store/auth/authStore';
import {
  addTutorialToWishlist,
  removeTutorialFromWishlist,
  getMyTutorialWishlist,
  addTutorialToFavorites,
  removeTutorialFromFavorites,
  getMyTutorialFavorites,
} from '@/services/tutorialService';

const useTutorialListsStore = create((set, get) => ({
  wishlistIds: [],
  favoriteIds: [],

  loadLists: async () => {
    const user = useAuthStore.getState().user;
    const isStudent = user?.role?.toLowerCase() === 'student';
    if (!user || !isStudent) {
      set({ wishlistIds: [], favoriteIds: [] });
      return;
    }
    try {
      const [w, f] = await Promise.all([
        getMyTutorialWishlist(),
        getMyTutorialFavorites(),
      ]);
      set({
        wishlistIds: w.map((t) => t.id),
        favoriteIds: f.map((t) => t.id),
      });
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to load tutorial lists', err);
      }
    }
  },

  toggleWishlist: async (id) => {
    const user = useAuthStore.getState().user;
    const isStudent = user?.role?.toLowerCase() === 'student';
    if (!user) {
      Router.push('/auth/login');
      return;
    }
    if (!isStudent) {
      toast.error('Only students can save tutorials.');
      return;
    }
    const { wishlistIds } = get();
    try {
      if (wishlistIds.includes(id)) {
        await removeTutorialFromWishlist(id);
        set({ wishlistIds: wishlistIds.filter((i) => i !== id) });
        toast.success('Removed from wishlist');
      } else {
        await addTutorialToWishlist(id);
        set({ wishlistIds: [...wishlistIds, id] });
        toast.success('Added to wishlist');
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to update wishlist';
      toast.error(message);
    }
  },

  toggleFavorite: async (id) => {
    const user = useAuthStore.getState().user;
    const isStudent = user?.role?.toLowerCase() === 'student';
    if (!user) {
      Router.push('/auth/login');
      return;
    }
    if (!isStudent) {
      toast.error('Only students can save tutorials.');
      return;
    }
    const { favoriteIds } = get();
    try {
      if (favoriteIds.includes(id)) {
        await removeTutorialFromFavorites(id);
        set({ favoriteIds: favoriteIds.filter((i) => i !== id) });
        toast.success('Removed from favorites');
      } else {
        await addTutorialToFavorites(id);
        set({ favoriteIds: [...favoriteIds, id] });
        toast.success('Added to favorites');
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to update favorites';
      toast.error(message);
    }
  },
}));

export default useTutorialListsStore;
