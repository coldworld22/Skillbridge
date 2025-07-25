import api from "@/services/api/api";

/**
 * Fetch all certificates for admin
 */
export const fetchAllCertificates = async () => {
  const { data } = await api.get("/certificates/admin");
  return data?.data ?? [];
};
