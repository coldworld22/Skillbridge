import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";
import { safeEncodeURI } from "@/utils/url";

const withBaseUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return safeEncodeURI(url);
  return safeEncodeURI(`${process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL}${url}`);
};

const formatResource = (resource = {}) => ({
  ...resource,
  downloadUrl: resource.resource_type === "file" ? withBaseUrl(resource.resource_url) : resource.resource_url,
  created_at: resource.created_at ? new Date(resource.created_at) : null,
});

export const fetchClassResources = async (classId) => {
  const { data } = await api.get(`/users/classes/resources/class/${classId}`);
  const list = data?.data ?? [];
  return list.map(formatResource);
};

export const createClassResource = async (classId, payload) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  const { data } = await api.post(
    `/users/classes/resources/class/${classId}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return formatResource(data?.data);
};

export const deleteClassResource = async (resourceId) => {
  await api.delete(`/users/classes/resources/${resourceId}`);
};
