// ─────────────────────────────────────────────────────────
// Admin Certificates API helpers
// ─────────────────────────────────────────────────────────
import api from "@/services/api/api";
import { toCamelCase } from "@/utils/case";

const mapCertificateResponse = (payload) => {
  if (payload === undefined || payload === null) {
    return payload;
  }
  return toCamelCase(payload);
};

/**
 * Fetch all certificates for admin
 */
export const fetchAllCertificates = async (page = 1, limit = 10) => {
  const { data } = await api.get("certificates/admin", {
    params: { page, limit },
  });
  const certificates = data?.data ?? [];
  return mapCertificateResponse(certificates) ?? [];
};

/** Fetch single certificate details */
export const getCertificate = async (id) => {
  const { data } = await api.get(`certificates/admin/${id}`);
  return mapCertificateResponse(data?.data);
};

/** Approve certificate */
export const approveCertificate = async (id) => {
  const { data } = await api.patch(`certificates/admin/${id}/approve`);
  return mapCertificateResponse(data?.data);
};

/** Reject certificate */
export const rejectCertificate = async (id) => {
  const { data } = await api.patch(`certificates/admin/${id}/reject`);
  return mapCertificateResponse(data?.data);
};

/** Issue certificate manually */
export const issueCertificate = async (payload) => {
  const { data } = await api.post("certificates/admin", payload);
  return mapCertificateResponse(data?.data);
};

/** Update certificate */
export const updateCertificate = async (id, payload) => {
  const { data } = await api.put(`certificates/admin/${id}`, payload);
  return mapCertificateResponse(data?.data);
};

/** Download certificate */
export const downloadCertificate = async (id) => {
  const res = await api.get(`certificates/admin/${id}/download`, {
    responseType: "blob",
  });
  return res.data;
};
