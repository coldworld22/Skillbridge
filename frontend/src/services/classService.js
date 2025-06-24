import api from "@/services/api/api";

export const fetchPublishedClasses = async () => {
  const { data } = await api.get("/users/classes");
  const list = data?.data ?? [];
  const formatted = list.map((cls) => ({
    ...cls,
    trending: Boolean(cls.trending),
  }));
  return { ...data, data: formatted };
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

export const fetchClassLessons = async (classId) => {
  const { data } = await api.get(`/users/classes/lessons/class/${classId}`);
  return data?.data ?? [];
};

export const fetchClassAssignments = async (classId) => {
  const { data } = await api.get(`/users/classes/assignments/class/${classId}`);
  return data?.data ?? [];
};
