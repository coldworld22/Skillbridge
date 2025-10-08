import api from "@/services/api/api";

export const fetchCoupons = async () => {
  const { data } = await api.get("/coupons/admin");
  return data?.data || [];
};

export const fetchCouponById = async (id) => {
  const { data } = await api.get(`/coupons/admin/${id}`);
  return data?.data;
};

export const createCoupon = async (payload) => {
  const { data } = await api.post("/coupons/admin", payload);
  return data?.data;
};

export const updateCoupon = async (id, payload) => {
  const { data } = await api.put(`/coupons/admin/${id}`, payload);
  return data?.data;
};

export const deleteCoupon = async (id) => {
  await api.delete(`/coupons/admin/${id}`);
};

export const validateCode = async (code, itemType, itemId) => {
  let url = `/coupons/code/${encodeURIComponent(code)}`;
  if (itemType) {
    url += `/${itemType}`;
    if (itemId) url += `/${itemId}`;
  }
  const { data } = await api.get(url);
  return data?.data;
};
