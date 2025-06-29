import api from "@/services/api/api";

export const createResponse = async (offerId, payload) => {
  const { data } = await api.post(`/offers/${offerId}/responses`, payload);
  return data?.data ?? data;
};

export const fetchResponses = async (offerId) => {
  const { data } = await api.get(`/offers/${offerId}/responses`);
  return data?.data ?? [];
};

export const fetchMessages = async (offerId, responseId) => {
  const { data } = await api.get(`/offers/${offerId}/responses/${responseId}/messages`);
  return data?.data ?? [];
};

export const sendMessage = async (offerId, responseId, message) => {
  const { data } = await api.post(`/offers/${offerId}/responses/${responseId}/messages`, { message });
  return data?.data ?? data;
};
