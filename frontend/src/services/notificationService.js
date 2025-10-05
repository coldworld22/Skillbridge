import api from "@/services/api/api";
import { getCsrfToken } from "@/services/api/csrf";
import logger from "@/utils/logger";

export const getNotifications = async () => {
  const res = await api.get("notifications");
  return res.data.data || res.data;
};

export const markNotificationAsRead = async (id) => {
  const headers = {};
  const token = getCsrfToken();
  if (token) headers["x-csrf-token"] = token;
  const res = await api.patch(`notifications/${id}/read`, {}, { headers });
  return res.data.data || res.data;
};

export const deleteNotification = async (id) => {
  const headers = {};
  const token = getCsrfToken();
  if (token) headers["x-csrf-token"] = token;
  const res = await api.delete(`notifications/${id}`, { headers });
  return res.data.data || res.data;
};

export const createNotification = async (payload) => {
  const res = await api.post("notifications", payload);
  return res.data.data || res.data;
};

// Local notification utilities
const notifications = [];

const notificationService = {
  push: (type, message, data = {}) => {
    const id = Date.now().toString();
    notifications.push({ id, type, message, data, read: false, timestamp: new Date() });
    logger.log(`[NOTIFY] ${type}: ${message}`);
  },

  getAll: async () => {
    return notifications;
  },

  markAsRead: async (id) => {
    const notif = notifications.find((n) => n.id === id);
    if (notif) notif.read = true;
  },

  clearAll: async () => {
    notifications.length = 0;
  },
};

export default notificationService;
