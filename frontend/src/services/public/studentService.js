import api from "@/services/api/api";

export const fetchPublicStudents = async () => {
  const { data } = await api.get("students");
  return data?.data ?? [];
};

export const fetchPublicStudentById = async (id) => {
  const { data } = await api.get(`students/${id}`);
  return data?.data;
};

export const sendEmailToStudent = async (id, { subject, message }) => {
  const { data } = await api.post(`students/${id}/email`, { subject, message });
  return data?.data || data;
};

export const sendWhatsAppToStudent = async (id, { message }) => {
  const { data } = await api.post(`students/${id}/whatsapp`, { message });
  return data?.data || data;
};

export const startVideoCallWithStudent = async (id) => {
  const { data } = await api.post(`students/${id}/video-call`);
  return data?.data || data;
};
