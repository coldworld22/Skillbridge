import api from "@/services/api/api";

export const fetchParticipants = async (roomId) => {
  const { data } = await api.get(`/video-calls/${roomId}/participants`);
  return data;
};

export const fetchCallMessages = async (roomId) => {
  const { data } = await api.get(`/video-calls/${roomId}/messages`);
  return data;
};

export const sendCallMessage = async (roomId, payload) => {
  const { data } = await api.post(`/video-calls/${roomId}/messages`, payload);
  return data;
};
