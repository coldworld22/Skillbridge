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
  const res = await api.patch(`/users/instructor/${id}/avatar`, formData);
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
  const res = await api.patch(`/users/instructor/${id}/demo`, formData);
  return res.data;
};

// 🔹 Delete instructor demo video
export const deleteInstructorDemo = async (id) => {
  const res = await api.delete(`/users/instructor/${id}/demo`);
  return res.data;
};

// 🔹 Upload instructor certificate (PDF or image)
export const uploadCertificateFile = async (formData) => {
  const res = await api.post("/users/instructor/certificates", formData);
  return res.data;
};


// 🔹 Delete certificate by ID
export const deleteCertificateFile = async (certificateId) => {
  const res = await api.delete(`/users/instructor/certificates/${certificateId}`);
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
  return res.data; // { message, is_online }
};

// 🔹 Get profile completion status
export const getInstructorStatus = async () => {
  const res = await api.get("/users/instructor/profile/status");
  return res.data;
};

// 🔹 Availability endpoints
export const getInstructorAvailability = async () => {
  const res = await api.get("/users/instructor/availability");
  return res.data;
};

export const updateInstructorAvailability = async (availability) => {
  const res = await api.patch("/users/instructor/availability", { availability_slots: availability });
  return res.data;
};

export const fetchInstructorDashboardStats = async () => {
  const res = await api.get("/users/instructor/dashboard-stats");
  return res.data?.data;
};

export const fetchInstructorTutorialViews = async (weeks = 4) => {
  const res = await api.get("/users/instructor/tutorial-views", {
    params: { weeks },
  });
  return res.data?.data ?? [];
};
