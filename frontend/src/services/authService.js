import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Login User
export const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, { email, password });
  return response.data;
};

// Register User
export const register = async (userData) => {
  const response = await axios.post(`${API_URL}/auth/register`, userData);
  return response.data;
};

// Logout User
export const logout = async () => {
  return await axios.post(`${API_URL}/auth/logout`);
};

// Forgot Password
export const forgotPassword = async (email) => {
  return await axios.post(`${API_URL}/auth/forgot-password`, { email });
};
