import api from "@/services/api/api";

export const validateCode = async (code, itemType, itemId) => {
  let url = `/coupons/code/${encodeURIComponent(code)}`;
  if (itemType) {
    url += `/${itemType}`;
    if (itemId) url += `/${itemId}`;
  }
  const { data } = await api.get(url);
  return data?.data;
};
