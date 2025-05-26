import api from "@/services/api/api";

// 🔹 Get full instructor profile (user + instructor + social + certificates)
export const getInstructorProfile = async () => {
  const res = await api.get("/users/instructor/profile");
  return res.data;
};

// 🔹 Update instructor profile
export const updateInstructorProfile = async (data) => {
  const res = await api.put("/users/instructor/profile", data);
  return res.data;
};

// 🔹 Upload instructor avatar
export const uploadInstructorAvatar = async (id, file) => {
  const formData = new FormData();
  formData.append("avatar", file);
  const res = await api.patch(`/users/instructor/${id}/avatar`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// 🔹 Delete instructor avatar
export const deleteInstructorAvatar = async (id) => {
  const res = await api.delete(`/users/instructor/${id}/avatar`);
  return res.data;
};

// 🔹 Upload instructor demo video
export const uploadInstructorDemo = async (id, file) => {
  const formData = new FormData();
  formData.append("demo", file);
  const res = await api.patch(`/users/instructor/${id}/demo`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// 🔹 Delete instructor demo video
export const deleteInstructorDemo = async (id) => {
  const res = await api.delete(`/users/instructor/${id}/demo`);
  return res.data;
};

// 🔹 Upload instructor certificate (PDF or image)
export const uploadCertificateFile = async (formData) => {
  const res = await api.post("/users/instructor/certificates", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};


// 🔹 Delete certificate by ID
export const deleteCertificateFile = async (certificateId) => {
  const res = await api.delete(`/instructor/certificates/${certificateId}`);
  return res.data;
};

// 🔹 Change instructor password
export const changeInstructorPassword = async (payload) => {
  const res = await api.patch("/users/instructor/change-password", payload);
  return res.data;
};

// 🔹 Toggle online/offline status
export const toggleInstructorStatus = async (is_online) => {
  const res = await api.patch("/users/instructor/status", { is_online });
  return res.data;
};

// 🔹 Get profile completion status
export const getInstructorStatus = async () => {
  const res = await api.get("/users/instructor/profile/status");
  return res.data;
};
