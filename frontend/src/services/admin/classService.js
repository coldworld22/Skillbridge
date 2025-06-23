import api from "@/services/api/api";

const formatClass = (cls) => ({
  ...cls,
  cover_image: cls.cover_image
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${cls.cover_image}`
    : null,
  demo_video_url: cls.demo_video_url
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${cls.demo_video_url}`
    : null,
});

export const fetchAdminClasses = async () => {
  const { data } = await api.get("/users/classes/admin");
  const list = data?.data ?? [];
  return list.map(formatClass);
};

export const fetchAdminClassById = async (id) => {
  const { data } = await api.get(`/users/classes/admin/${id}`);
  return data?.data ? formatClass(data.data) : null;
};

export const createAdminClass = async (payload) => {
  const { data } = await api.post("/users/classes/admin", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data?.data ? formatClass(data.data) : null;
};

export const updateAdminClass = async (id, payload) => {
  const { data } = await api.put(`/users/classes/admin/${id}`, payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data?.data ? formatClass(data.data) : null;
};

export const deleteAdminClass = async (id) => {
  await api.delete(`/users/classes/admin/${id}`);
  return true;
};

export const fetchAdminClassAnalytics = async (id) => {
  const { data } = await api.get(`/users/classes/admin/${id}/analytics`);
  return data?.data ?? {};
};
