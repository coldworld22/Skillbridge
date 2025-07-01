import api from "@/services/api/api";

export const fetchClassScores = async (classId) => {
  const { data } = await api.get(`/classes/scores/instructor/${classId}`);
  return data?.data ?? [];
};

export const setScoringPolicy = async (classId, payload) => {
  const { data } = await api.post(`/classes/scores/policy/${classId}`, payload);
  return data?.data;
};

export const issueClassCertificate = async (classId, studentId) => {
  const { data } = await api.post(
    `/classes/scores/instructor/${classId}/students/${studentId}/issue`
  );
  return data?.data;
};

export const fetchMyClassScore = async (classId) => {
  const { data } = await api.get(`/classes/scores/student/${classId}`);
  return data?.data;
};
