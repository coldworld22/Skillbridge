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
  const { data } = await api.patch("/app-config/logo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data?.data;
};

