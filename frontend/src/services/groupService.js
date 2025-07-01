import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";


const formatGroup = (g) => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL;
  return {
    ...g,
    cover_image: g.cover_image ? `${base}${g.cover_image}` : g.cover_image,
    membersCount: g.members_count ?? g.membersCount ?? 0,
  };
};


const groupService = {
  getMyGroups: async () => {
    const { data } = await api.get("/groups/my");
    const list = data?.data ?? [];
    return Array.isArray(list) ? list.map(formatGroup) : list;
  },

  getTags: async () => {
    const { data } = await api.get("/groups/tags");
    return data?.data ?? [];
  },

  getPublicGroups: async (search) => {
    const { data } = await api.get("/groups", { params: { search } });
    const list = data?.data ?? [];
    return Array.isArray(list) ? list.map(formatGroup) : list;
  },

  joinGroup: async (groupId) => {
    const { data } = await api.post(`/groups/${groupId}/join`);
    return data?.data;
  },

  createGroup: async (payload) => {
    const { data } = await api.post('/groups', payload, {
      headers: payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return data?.data ? formatGroup(data.data) : null;
  },
};

export default groupService;
