import api from "@/services/api/api";

export const uploadChapterVideo = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append("video", file);
  const res = await api.post("/users/tutorials/chapters/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
  return res.data;
};

export const fetchChaptersByTutorial = async (tutorialId) => {
  const { data } = await api.get(
    `/users/tutorials/chapters/tutorial/${tutorialId}`
  );
  return data?.data || [];
};
