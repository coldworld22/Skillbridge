import api from "@/services/api/api";

export const fetchSocialLoginConfig = async () => {
  const { data } = await api.get("/social-login/config");
  return data?.data ?? null;
};

export const updateSocialLoginConfig = async (payload) => {
  const { data } = await api.put("/social-login/config", payload);
  return data?.data;
};
