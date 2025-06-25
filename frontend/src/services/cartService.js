import api from "@/services/api/api";
import mockCart from "@/mocks/sampleCart.json"; // Import mock data

const MOCK_MODE = false;

export const getCartItems = async () => {
  if (MOCK_MODE) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockCart), 500);
    });
  }
  const res = await api.get('/cart');
  return res.data?.data ?? res.data;
};

export const addToCart = async (item) => {
  try {
    const { data } = await api.post('/cart/add', item);
    return data;
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return null;
  }
};

export const updateCartItem = async (id, quantity) => {
  try {
    const { data } = await api.put(`/cart/update/${id}`, { quantity });
    return data;
  } catch (error) {
    console.error('Error updating cart item:', error);
    return null;
  }
};

export const removeCartItem = async (id) => {
  try {
    const { data } = await api.delete(`/cart/remove/${id}`);
    return data;
  } catch (error) {
    console.error('Error removing item from cart:', error);
    return null;
  }
};
