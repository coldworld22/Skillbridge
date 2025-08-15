import api from "@/services/api/api";

export const fetchClassAttendance = async (lessonId) => {
  const { data } = await api.get(`/users/classes/attendance/${lessonId}`);
  return data?.data ?? [];
};

export const updateClassAttendance = async (lessonId, userId, attended) => {
  const { data } = await api.post(
    `/users/classes/attendance/${lessonId}/${userId}`,
    { attended }
  );
  return data?.data;
};
