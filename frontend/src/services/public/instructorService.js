import api from "@/services/api/api";

export const fetchPublicInstructors = async () => {
  const { data } = await api.get("instructors");
  return data?.data ?? [];
};

export const fetchPublicInstructorById = async (id) => {
  const { data } = await api.get(`instructors/${id}`);
  return data?.data;
};

export const fetchInstructorAvailability = async (id) => {
  const { data } = await api.get(`instructors/${id}/availability`);
  return data?.data ?? [];
};

export const fetchInstructorStats = async (id) => {
  const { data } = await api.get(`instructors/${id}/stats`);
  return data?.data || data;
};

export const sendEmailToInstructor = async (id, { subject, message }) => {
  const { data } = await api.post(`instructors/${id}/email`, { subject, message });
  return data?.data || data;
};

export const sendWhatsAppToInstructor = async (id, { message }) => {
  const { data } = await api.post(`instructors/${id}/whatsapp`, { message });
  return data?.data || data;
};

export const startVideoCallWithInstructor = async (id) => {
  const { data } = await api.post(`instructors/${id}/video-call`);
  return data?.data || data;
};
