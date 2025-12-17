import api from "@/services/api/api";

export const fetchClassStudents = async (classId) => {
  if (!classId) {
    return [];
  }
  const { data } = await api.get(`/users/classes/instructor/${classId}/students`);
  return data?.data ?? data ?? [];
};

export const fetchInstructorStudentDetail = async (classId, studentId) => {
  if (!classId || !studentId) return null;
  const { data } = await api.get(
    `/users/classes/instructor/${classId}/students/${studentId}`,
  );
  return data?.data ?? data ?? null;
};
