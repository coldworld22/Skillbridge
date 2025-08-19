import api from "@/services/api/api";

export const getTemplates = async () => {
  const res = await api.get("/certificate-templates");
  return res.data?.data || [];
};

export const getTemplate = async (id) => {
  const res = await api.get(`/certificate-templates/${id}`);
  return res.data?.data || null;
};

export const saveTemplate = async (template) => {
  const res = await api.post("/certificate-templates", template);
  return res.data?.data;
};

export const updateTemplate = async (id, data) => {
  const res = await api.put(`/certificate-templates/${id}`, data);
  return res.data?.data;
};

export const deleteTemplate = async (id) => {
  await api.delete(`/certificate-templates/${id}`);
};

export const toggleTemplateStatus = async (id) => {
  const res = await api.patch(`/certificate-templates/${id}/toggle`);
  return res.data?.data;
};
