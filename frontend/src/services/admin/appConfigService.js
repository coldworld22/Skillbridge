import api from "@/services/api/api";

export const fetchAppConfig = async () => {
  const { data } = await api.get("/app-config");
  return data?.data ?? {};
};

export const updateAppConfig = async (payload) => {
  const { data } = await api.put("/app-config", payload);
  return data?.data;
};

export const uploadAppLogo = async (file) => {
  const formData = new FormData();
  formData.append("logo", file);
  const { data } = await api.patch("/app-config/logo", formData);
  return data?.data;
};


export const uploadAppFavicon = async (file) => {
  const formData = new FormData();
  formData.append("favicon", file);
  const { data } = await api.patch("/app-config/favicon", formData);
  return data?.data;
};

export const uploadHomeBackground = async (file) => {
  const formData = new FormData();
  formData.append("home_bg", file);
  const { data } = await api.patch("/app-config/home-bg", formData);
  return data?.data;
};

