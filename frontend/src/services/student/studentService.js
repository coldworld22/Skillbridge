import api from "@/services/api/api";  

// Get student profile (GET)
export const getStudentProfile = async () => {
  const res = await api.get("/users/student/profile");
  return res.data;
};

// Update student profile (PUT)
export const updateStudentProfile = async (payload) => {
  const res = await api.put("/users/student/profile", payload);
  return res.data;
};

// Upload avatar (PATCH + multipart/form-data)
export const uploadStudentAvatar = async (userId, file) => {
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await api.patch(`/users/student/${userId}/avatar`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};

// Upload identity document (PDF)
export const uploadStudentIdentity = async (userId, file) => {
  const formData = new FormData();
  formData.append("identity", file);

  const res = await api.patch(`/users/student/${userId}/identity`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};

/**
 * 
 * @param {*} param0 
 * @returns 
 */
export const changeStudentPassword = async ({ currentPassword, newPassword }) => {
  const res = await api.patch("/users/student/change-password", {
    currentPassword,
    newPassword,
  });
  return res.data;
};



