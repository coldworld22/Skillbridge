// ─────────────────────────────────────────────────────────
// Instructor Certificates API helpers
// ─────────────────────────────────────────────────────────
import api from "@/services/api/api";

export const fetchCertificates = async () => {
  const { data } = await api.get("/certificates/instructor");
  return data?.data ?? [];
};

export const getCertificate = async (id) => {
  const { data } = await api.get(`/certificates/instructor/${id}`);
  return data?.data;
};

export const deleteCertificate = async (id) => {
  await api.delete(`/certificates/instructor/${id}`);
};

export const issueCertificate = async (payload) => {
  const { data } = await api.post("/certificates/instructor", payload);
  return data?.data;
};

export const downloadCertificate = async (id) => {
  const res = await api.get(`/certificates/instructor/${id}/download`, {
    responseType: "blob",
  });
  return res.data;
};

export const fetchClassStudents = async (classId) => {
  const { data } = await api.get(`/classes/${classId}/students`);
  return data?.data;
};
