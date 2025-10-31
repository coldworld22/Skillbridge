import api from "@/services/api/api";

const normalizeCoupon = (coupon) => {
  if (!coupon) return coupon;
  return {
    ...coupon,
    usage_limit:
      coupon.usage_limit === undefined || coupon.usage_limit === null
        ? null
        : Number(coupon.usage_limit),
    times_used:
      coupon.times_used === undefined || coupon.times_used === null
        ? 0
        : Number(coupon.times_used),
  };
};

const prepareList = (list) =>
  Array.isArray(list) ? list.map(normalizeCoupon) : [];

export const fetchCoupons = async () => {
  const { data } = await api.get("/coupons/admin");
  return prepareList(data?.data);
};

export const fetchCouponById = async (id) => {
  const { data } = await api.get(`/coupons/admin/${id}`);
  return normalizeCoupon(data?.data);
};

export const createCoupon = async (payload) => {
  const { data } = await api.post("/coupons/admin", payload);
  return normalizeCoupon(data?.data);
};

export const updateCoupon = async (id, payload) => {
  const { data } = await api.put(`/coupons/admin/${id}`, payload);
  return normalizeCoupon(data?.data);
};

export const deleteCoupon = async (id) => {
  await api.delete(`/coupons/admin/${id}`);
};

export const fetchCouponTargets = async () => {
  const { data } = await api.get("/coupons/instructor/targets");
  const payload = data?.data || {};
  const normalize = (items) =>
    Array.isArray(items)
      ? items.map((item) => ({
          ...item,
          id: item.id,
          title: item.title,
          price:
            item.price === undefined || item.price === null
              ? null
              : Number(item.price),
          status: item.status || null,
        }))
      : [];

  return {
    classes: normalize(payload.classes),
    tutorials: normalize(payload.tutorials),
  };
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
