import api from "@/services/api/api";

export const fetchContactConfig = async () => {
  const { data } = await api.get("contact-config");
  return data?.data ?? {};
};

export const updateContactConfig = async (payload) => {
  const { data } = await api.put("contact-config", payload);
  return data?.data;
};
