import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  getCartItems,
  addToCart as apiAddToCart,
  updateCartItem,
  removeCartItem,
} from "@/services/cartService";

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,

      fetchCart: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await getCartItems();
          set({ items: data, isLoading: false });
        } catch (err) {
          set({ error: err.message, isLoading: false });
        }
      },

      addItem: async (item) => {
        set({ isLoading: true, error: null });
        try {
          await apiAddToCart(item);
          const data = await getCartItems();
          set({ items: data, isLoading: false });
        } catch (err) {
          set({ error: err.message, isLoading: false });
        }
      },

      updateItem: async (id, quantity) => {
        set({ isLoading: true, error: null });
        try {
          await updateCartItem(id, quantity);
          const data = await getCartItems();
          set({ items: data, isLoading: false });
        } catch (err) {
          set({ error: err.message, isLoading: false });
        }
      },

      removeItem: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await removeCartItem(id);
          const data = await getCartItems();
          set({ items: data, isLoading: false });
        } catch (err) {
          set({ error: err.message, isLoading: false });
        }
      },

      clearCart: () => set({ items: [] }),
    }),
    { name: "cart-store" }
  )
);

export default useCartStore;
