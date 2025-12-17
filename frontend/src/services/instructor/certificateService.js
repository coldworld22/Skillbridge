// ─────────────────────────────────────────────────────────
// Instructor Certificates API helpers
// ─────────────────────────────────────────────────────────
import api from "@/services/api/api";

export const fetchCertificates = async (params = {}) => {
  const { data } = await api.get("/certificates/instructor", { params });
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

export { fetchClassStudents } from "@/services/instructor/studentService";
