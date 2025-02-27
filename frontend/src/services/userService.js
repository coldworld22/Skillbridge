import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Get User Profile
export const getUserProfile = async (userId) => {
  const response = await axios.get(`${API_URL}/users/${userId}`);
  return response.data;
};

// Update User Profile
export const updateUserProfile = async (userId, userData) => {
  return await axios.put(`${API_URL}/users/${userId}`, userData);
};

// Change Password
export const changePassword = async (userId, passwordData) => {
  return await axios.post(`${API_URL}/users/change-password/${userId}`, passwordData);
};
