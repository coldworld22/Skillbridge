import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Process Payment (Stripe, PayPal, Crypto)
export const processPayment = async (paymentData) => {
  const response = await axios.post(`${API_URL}/payment`, paymentData);
  return response.data;
};

// Get Payment Status
export const getPaymentStatus = async (transactionId) => {
  const response = await axios.get(`${API_URL}/payment/status/${transactionId}`);
  return response.data;
};


const notifications = [];

const notificationService = {
  push: (type, message, data = {}) => {
    const id = Date.now().toString();
    notifications.push({ id, type, message, data, read: false, timestamp: new Date() });
    console.log(`[NOTIFY] ${type}: ${message}`);
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
