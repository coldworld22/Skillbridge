import api from "@/services/api/api";

export const fetchLicenseStatus = async () => {
  const { data } = await api.get("/license/status");
  return data?.data ?? {};
};

export const fetchLicenseLogs = async () => {
  const { data } = await api.get("/license/logs");
  return data?.data ?? [];
};

