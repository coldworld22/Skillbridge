import api from "@/services/api/api";

export const fetchPublishedClasses = async () => {
  const res = await api.get("/users/classes");
  return res.data;
};

export const fetchClassDetails = async (id) => {
  const res = await api.get(`/users/classes/${id}`);
  return res.data;
};

export const enrollInClass = async (id) => {
  const { data } = await api.post(`/users/classes/enroll/${id}`);
  return data;
};

export const markClassCompleted = async (id) => {
  const { data } = await api.post(`/users/classes/enroll/${id}/complete`);
  return data;
};

export const fetchMyEnrolledClasses = async () => {
  const { data } = await api.get("/users/classes/enroll/my");
  return data?.data ?? [];
};
