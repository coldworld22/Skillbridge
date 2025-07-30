import api from "@/services/api/api";

export const validateCode = async (code) => {
  const { data } = await api.get(`/coupons/code/${code}`);
  return data?.data;
};
