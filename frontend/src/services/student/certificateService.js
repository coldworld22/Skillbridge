// ─────────────────────────────────────────────────────────
// Student Certificates API helpers
// ─────────────────────────────────────────────────────────
import api from "@/services/api/api";
import {
  normalizeCertificate,
  normalizeCertificates,
} from "@/services/certificates/transformers";

export const fetchCertificates = async () => {
  const { data } = await api.get("/certificates/student");
  return normalizeCertificates(data?.data);
};

export const getCertificate = async (id) => {
  const { data } = await api.get(`/certificates/student/${id}`);
  return normalizeCertificate(data?.data);
};

export const downloadCertificate = async (id) => {
  const res = await api.get(`/certificates/student/${id}/download`, {
    responseType: "blob",
  });
  return res.data;
};

export const issueCertificate = async (id) => {
  const { data } = await api.patch(`/certificates/student/${id}/issue`);
  return normalizeCertificate(data?.data);
};

export const revokeCertificate = async (id) => {
  const { data } = await api.patch(`/certificates/student/${id}/revoke`);
  return normalizeCertificate(data?.data);
};
