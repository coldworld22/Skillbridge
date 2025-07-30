// Re-export the admin contact settings fetcher so the public
// site and admin dashboard share a single implementation.
export { fetchContactConfig } from "@/services/admin/contactConfigService";
import api from "@/services/api/api";

export const sendContactMessage = async (payload) => {
  const { data } = await api.post("/contact", payload);
  return data?.message || data?.data;
};
