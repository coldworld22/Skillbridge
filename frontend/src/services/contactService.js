import api from "@/services/api/api";

export const fetchContactConfig = async () => {
  const { data } = await api.get("/contact-config");
  return data?.data ?? {};
};
