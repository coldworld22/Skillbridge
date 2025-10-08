import api from "@/services/api/api";

export const fetchSocialLoginConfig = async () => {
  const { data } = await api.get("/social-login/config");
  return data?.data ?? null;
};
