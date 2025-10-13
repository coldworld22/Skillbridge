import { create } from "zustand";
import { persist } from "zustand/middleware";

// Ensure SSR safety: don't touch localStorage on the server.
const isClient = typeof window !== "undefined";

const createWishlistStore = (set) => ({
  wishlist: [],
  addToWishlist: (book) =>
    set((state) => {
      const exists = state.wishlist.some((item) => item.book_id === book.book_id);
      if (exists) return state;
      return { wishlist: [...state.wishlist, book] };
    }),
  removeFromWishlist: (bookId) =>
    set((state) => ({
      wishlist: state.wishlist.filter((item) => item.book_id !== bookId),
    })),
  clearWishlist: () => set({ wishlist: [] }),
});

const useBookWishlistStore = create(
  isClient
    ? persist(createWishlistStore, { name: "book-wishlist" })
    : createWishlistStore
);

export default useBookWishlistStore;
