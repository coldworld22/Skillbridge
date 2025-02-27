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
