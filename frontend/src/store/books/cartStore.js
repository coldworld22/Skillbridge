import { create } from "zustand";
import { persist } from "zustand/middleware";

// Basic cart store for bookstore
// Structure: [{ book_id, title, price, cover_url }]
const useBookCartStore = create(
  persist(
    (set) => ({
      cartItems: [],
      addToCart: (book) =>
        set((state) => {
          const exists = state.cartItems.some(
            (item) => item.book_id === book.book_id
          );
          if (exists) {
            return state;
          }
          return { cartItems: [...state.cartItems, book] };
        }),
      removeFromCart: (bookId) =>
        set((state) => ({
          cartItems: state.cartItems.filter((item) => item.book_id !== bookId),
        })),
      clearCart: () => set({ cartItems: [] }),
    }),
    { name: "book-cart" }
  )
);

export default useBookCartStore;
