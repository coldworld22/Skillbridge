import mockCart from "@/mocks/sampleCart.json"; // Import mock data
const API_BASE_URL = "https://your-backend-api.com/api"; // Change this to your backend URL

export const getCartItems = async () => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockCart), 500); // Simulate network delay
    });
  };

export const addToCart = async (item) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cart/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    return await response.json();
  } catch (error) {
    console.error("Error adding item to cart:", error);
    return null;
  }
};

export const updateCartItem = async (id, quantity) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cart/update/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error updating cart item:", error);
    return null;
  }
};

export const removeCartItem = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cart/remove/${id}`, {
      method: "DELETE",
    });
    return await response.json();
  } catch (error) {
    console.error("Error removing item from cart:", error);
    return null;
  }
};
