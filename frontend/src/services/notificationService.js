import api from "@/services/api/api";
import { getCsrfToken } from "@/services/api/csrf";

export const getNotifications = async () => {
  const res = await api.get("/notifications");
  return res.data.data || res.data;
};

export const markNotificationAsRead = async (id) => {
  const headers = {};
  const token = getCsrfToken();
  if (token) headers["x-csrf-token"] = token;
  const res = await api.patch(`/notifications/${id}/read`, {}, { headers });
  return res.data.data || res.data;
};

export const deleteNotification = async (id) => {
  const headers = {};
  const token = getCsrfToken();
  if (token) headers["x-csrf-token"] = token;
  const res = await api.delete(`/notifications/${id}`, { headers });
  return res.data.data || res.data;
};

export const createNotification = async (payload) => {
  const res = await api.post('/notifications', payload);
  return res.data.data || res.data;
};
