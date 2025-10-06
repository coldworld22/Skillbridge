import api from "@/services/api/api";

export const getCartItems = async () => {
  try {
    const res = await api.get("cart");
    return res.data?.data ?? res.data;
  } catch (error) {
    console.error("Error fetching cart items:", error);
    return [];
  }
};

export const addToCart = async (item) => {
  try {
    const { data } = await api.post('cart/add', item);
    return data;
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return null;
  }
};

export const updateCartItem = async (id, quantity) => {
  try {
    const { data } = await api.put(`cart/update/${id}`, { quantity });
    return data;
  } catch (error) {
    console.error('Error updating cart item:', error);
    return null;
  }
};

export const removeCartItem = async (id) => {
  try {
    const { data } = await api.delete(`cart/remove/${id}`);
    return data;
  } catch (error) {
    console.error('Error removing item from cart:', error);
    return null;
  }
};
