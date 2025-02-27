import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Get User Notifications
export const getNotifications = async (userId) => {
  const response = await axios.get(`${API_URL}/notifications/${userId}`);
  return response.data;
};

// Mark Notification as Read
export const markNotificationAsRead = async (notificationId) => {
  return await axios.put(`${API_URL}/notifications/${notificationId}/read`);
};
