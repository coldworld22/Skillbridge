import api from "@/services/api/api";

export const fetchClassAttendance = async (classId) => {
  const { data } = await api.get(`/users/classes/attendance/${classId}`);
  return data?.data ?? [];
};

export const updateClassAttendance = async (classId, userId, attended) => {
  const { data } = await api.post(
    `/users/classes/attendance/${classId}/${userId}`,
    { attended }
  );
  return data?.data;
};
