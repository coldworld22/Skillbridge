import { create } from "zustand";
import { persist } from "zustand/middleware";

// Basic wishlist store for bookstore
// Structure: [{ book_id, title, price, cover_url }]
const useBookWishlistStore = create(
  persist(
    (set) => ({
      wishlist: [],
      addToWishlist: (book) =>
        set((state) => {
          const exists = state.wishlist.some(
            (item) => item.book_id === book.book_id
          );
          if (exists) {
            return state;
          }
          return { wishlist: [...state.wishlist, book] };
        }),
      removeFromWishlist: (bookId) =>
        set((state) => ({
          wishlist: state.wishlist.filter((item) => item.book_id !== bookId),
        })),
      clearWishlist: () => set({ wishlist: [] }),
    }),
    { name: "book-wishlist" }
  )
);

export default useBookWishlistStore;
