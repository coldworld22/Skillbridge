import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  fetchBookWishlist as apiFetchBookWishlist,
  addBookToWishlist as apiAddBookToWishlist,
  removeBookFromWishlist as apiRemoveBookFromWishlist,
} from "@/services/bookService";
import { mapBookForWishlist } from "@/utils/bookMapping";

const isClient = typeof window !== "undefined";

const normalizeWishlistEntry = (book) => {
  if (!book) return null;
  if (book.book_id != null) return book;
  const normalized = mapBookForWishlist(book);
  return normalized?.book_id != null ? normalized : null;
};

const createWishlistStore = (set, get) => ({
  wishlist: [],
  isLoading: false,
  error: null,
  hasHydrated: false,

  fetchWishlist: async (force = false) => {
    if (!isClient) return [];
    if (get().isLoading) return get().wishlist;
    if (get().hasHydrated && !force) {
      return get().wishlist;
    }

    set({ isLoading: true, error: null });
    try {
      const data = await apiFetchBookWishlist();
      const normalized = data
        .map((book) => normalizeWishlistEntry(book))
        .filter(Boolean);
      set({
        wishlist: normalized,
        isLoading: false,
        error: null,
        hasHydrated: true,
      });
      return normalized;
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to load wishlist";
      set({
        isLoading: false,
        error: message,
        hasHydrated: true,
      });
      throw err;
    }
  },

  addToWishlist: async (book) => {
    const entry = normalizeWishlistEntry(book);
    if (!entry) return false;
    if (get().wishlist.some((item) => item.book_id === entry.book_id)) {
      return true;
    }

    const previous = get().wishlist;
    set({ wishlist: [...previous, entry], error: null });
    try {
      await apiAddBookToWishlist(entry.book_id);
      return true;
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update wishlist";
      set({ wishlist: previous, error: message });
      return false;
    }
  },

  removeFromWishlist: async (bookId) => {
    if (bookId == null) return false;
    const idKey = String(bookId);
    const previous = get().wishlist;
    const filtered = previous.filter((item) => String(item.book_id) !== idKey);
    set({ wishlist: filtered, error: null });
    try {
      await apiRemoveBookFromWishlist(bookId);
      return true;
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update wishlist";
      set({ wishlist: previous, error: message });
      return false;
    }
  },

  clearWishlist: () =>
    set({
      wishlist: [],
      hasHydrated: false,
      error: null,
    }),
});

const useBookWishlistStore = create(
  isClient
    ? persist(createWishlistStore, { name: "book-wishlist" })
    : createWishlistStore
);

export default useBookWishlistStore;
