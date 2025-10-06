// ─────────────────────────────────────────────────────────
// Student Certificates API helpers
// ─────────────────────────────────────────────────────────
import api from "@/services/api/api";
import { toCamelCase } from "@/utils/case";

const mapCertificateResponse = (payload) => {
  if (payload === undefined || payload === null) {
    return payload;
  }
  return toCamelCase(payload);
};

export const fetchCertificates = async () => {
  const { data } = await api.get("certificates/student");
  const certificates = data?.data ?? [];
  return mapCertificateResponse(certificates) ?? [];
};

export const getCertificate = async (id) => {
  const { data } = await api.get(`certificates/student/${id}`);
  return mapCertificateResponse(data?.data);
};

export const downloadCertificate = async (id) => {
  const res = await api.get(`certificates/student/${id}/download`, {
    responseType: "blob",
  });
  return res.data;
};

export const issueCertificate = async (id) => {
  const { data } = await api.patch(`certificates/student/${id}/issue`);
  return mapCertificateResponse(data?.data);
};

export const revokeCertificate = async (id) => {
  const { data } = await api.patch(`certificates/student/${id}/revoke`);
  return mapCertificateResponse(data?.data);
};
