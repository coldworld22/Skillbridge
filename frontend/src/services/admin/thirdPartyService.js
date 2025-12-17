import api from "@/services/api/api";

export const fetchThirdPartyConfig = async () => {
  const { data } = await api.get("/third-party-config");
  return data?.data ?? {};
};

export const updateThirdPartyConfig = async (payload) => {
  const { recaptcha, ...rest } = payload || {};
  const { data } = await api.put("/third-party-config", rest);
  return data?.data;
};
