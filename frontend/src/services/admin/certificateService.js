// ─────────────────────────────────────────────────────────
// Admin Certificates API helpers
// ─────────────────────────────────────────────────────────
import api from "@/services/api/api";

/**
 * Fetch all certificates for admin
 */
export const fetchAllCertificates = async (page = 1, limit = 10) => {
  const { data } = await api.get("/certificates/admin", {
    params: { page, limit },
  });
  return data?.data ?? [];
};

/** Fetch single certificate details */
export const getCertificate = async (id) => {
  const { data } = await api.get(`/certificates/admin/${id}`);
  return data?.data;
};

/** Approve certificate */
export const approveCertificate = async (id) => {
  const { data } = await api.patch(`/certificates/admin/${id}/approve`);
  return data?.data;
};

/** Reject certificate */
export const rejectCertificate = async (id) => {
  const { data } = await api.patch(`/certificates/admin/${id}/reject`);
  return data?.data;
};

/** Issue certificate manually */
export const issueCertificate = async (payload) => {
  const { data } = await api.post("/certificates/admin", payload);
  return data?.data;
};

/** Update certificate */
export const updateCertificate = async (id, payload) => {
  const { data } = await api.put(`/certificates/admin/${id}`, payload);
  return data?.data;
};

/** Download certificate */
export const downloadCertificate = async (id) => {
  const res = await api.get(`/certificates/admin/${id}/download`, {
    responseType: "blob",
  });
  return res.data;
};
