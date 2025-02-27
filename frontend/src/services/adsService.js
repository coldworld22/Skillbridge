import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Get all Ads
export const getAds = async () => {
  const response = await axios.get(`${API_URL}/ads`);
  return response.data;
};

// Create a new Ad (Admin Only)
export const createAd = async (adData) => {
  const response = await axios.post(`${API_URL}/ads`, adData);
  return response.data;
};
