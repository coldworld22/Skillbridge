import api from "@/services/api/api";

export const fetchParticipants = async (roomId) => {
  const { data } = await api.get(`/video-calls/${roomId}/participants`);
  return data;
};
