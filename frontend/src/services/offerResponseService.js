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

export const sendMessage = async (offerId, responseId, message, replyTo) => {
  const payload = { message };
  if (replyTo) payload.replyTo = replyTo;
  const { data } = await api.post(
    `/offers/${offerId}/responses/${responseId}/messages`,
    payload
  );
  return data?.data ?? data;
};

export const deleteMessage = async (offerId, responseId, messageId) => {
  const { data } = await api.delete(
    `/offers/${offerId}/responses/${responseId}/messages/${messageId}`
  );
  return data?.data ?? data;
};
