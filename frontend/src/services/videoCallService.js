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

export const muteParticipant = async (roomId, participantId, isMuted) => {
  const { data } = await api.patch(
    `/video-calls/${roomId}/participants/${participantId}`,
    { isMuted }
  );
  return data;
};

export const removeParticipant = async (roomId, participantId) => {
  await api.delete(`/video-calls/${roomId}/participants/${participantId}`);
};

export const makeCoHost = async (roomId, participantId) => {
  const { data } = await api.patch(
    `/video-calls/${roomId}/participants/${participantId}`,
    { role: "co-host" }
  );
  return data;
};

export const fetchSessionStatus = async (roomId) => {
  const { data } = await api.get(`/video-calls/${roomId}/status`);
  return data;
};
