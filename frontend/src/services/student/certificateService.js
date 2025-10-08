// ─────────────────────────────────────────────────────────
// Student Certificates API helpers
// ─────────────────────────────────────────────────────────
import api from "@/services/api/api";

export const fetchCertificates = async () => {
  const { data } = await api.get("/certificates/student");
  return data?.data ?? [];
};

export const getCertificate = async (id) => {
  const { data } = await api.get(`/certificates/student/${id}`);
  return data?.data;
};

export const downloadCertificate = async (id) => {
  const res = await api.get(`/certificates/student/${id}/download`, {
    responseType: "blob",
  });
  return res.data;
};

export const issueCertificate = async (id) => {
  const { data } = await api.patch(`/certificates/student/${id}/issue`);
  return data?.data;
};

export const revokeCertificate = async (id) => {
  const { data } = await api.patch(`/certificates/student/${id}/revoke`);
  return data?.data;
};
