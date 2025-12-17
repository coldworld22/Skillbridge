import api from "@/services/api/api";

export const fetchStudentSettings = async () => {
  const { data } = await api.get("/users/student/settings");
  return data;
};

export const updateStudentAccount = async (payload) => {
  const { data } = await api.patch("/users/student/settings/account", payload);
  return data;
};

export const updateLearningPreferences = async (payload) => {
  const { data } = await api.patch(
    "/users/student/settings/learning",
    payload
  );
  return data;
};

export const updatePrivacySettings = async (payload) => {
  const { data } = await api.patch("/users/student/settings/privacy", payload);
  return data;
};

export const updateUiPreferences = async (payload) => {
  const { data } = await api.patch("/users/student/settings/ui", payload);
  return data;
};
