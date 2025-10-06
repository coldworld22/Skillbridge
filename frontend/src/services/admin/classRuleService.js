import api from "@/services/api/api";

export const fetchClassRules = async (classId) => {
  const { data } = await api.get(`users/classes/admin/${classId}/rules`);
  return data?.data ?? [];
};

export const createClassRule = async (classId, payload) => {
  const { data } = await api.post(`users/classes/admin/${classId}/rules`, payload);
  return data?.data ?? null;
};

export const updateClassRule = async (classId, ruleId, payload) => {
  const { data } = await api.put(`users/classes/admin/${classId}/rules/${ruleId}`, payload);
  return data?.data ?? null;
};

export const deleteClassRule = async (classId, ruleId) => {
  await api.delete(`users/classes/admin/${classId}/rules/${ruleId}`);
  return true;
};

