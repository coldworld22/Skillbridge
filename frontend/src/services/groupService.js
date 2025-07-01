import api from "@/services/api/api";

const groupService = {
  getMyGroups: async () => {
    const { data } = await api.get("/groups/my");
    return data?.data ?? [];
  },

  getTags: async () => {
    const { data } = await api.get("/groups/tags");
    return data?.data ?? [];
  },

  getPublicGroups: async (search) => {
    const { data } = await api.get("/groups", { params: { search } });
    return data?.data ?? [];
  },

  joinGroup: async (groupId) => {
    const { data } = await api.post(`/groups/${groupId}/join`);
    return data?.data;
  },

  createGroup: async (payload) => {
    const { data } = await api.post('/groups', payload);
    return data?.data;
  },
};

export default groupService;
