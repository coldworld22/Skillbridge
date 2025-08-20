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
