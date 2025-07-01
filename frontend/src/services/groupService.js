import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";


const formatGroup = (g) => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL;
  const tags = g.tags
    ? Array.isArray(g.tags)
      ? g.tags
      : typeof g.tags === 'string'
        ? JSON.parse(g.tags)
        : []
    : [];
  return {
    ...g,
    cover_image: g.cover_image ? `${base}${g.cover_image}` : g.cover_image,
    membersCount: g.members_count ?? g.membersCount ?? 0,
    isPublic: g.visibility ? g.visibility === 'public' : g.isPublic ?? true,
    createdAt: g.created_at ?? g.createdAt,
    tags,
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
    const { data } = await api.get('/groups', { params: { search } });
    const list = data?.data ?? [];
    const groups = Array.isArray(list) ? list.map(formatGroup) : list;
    return groups.filter((g) => g.isPublic);
  },

  getGroupById: async (id) => {
    const { data } = await api.get(`/groups/${id}`);
    return data?.data ? formatGroup(data.data) : null;
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

  getGroupMembers: async (groupId) => {
    const { data } = await api.get(`/groups/${groupId}/members`);
    const list = data?.data ?? [];

    const base = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL;
    return list.map((m) => {
      const avatar = m.avatar
        ? m.avatar.startsWith('http') || m.avatar.startsWith('blob:')
          ? m.avatar
          : `${base}${m.avatar}`
        : '/images/default-avatar.png';
      return {
        id: m.user_id,
        name: m.name,
        avatar,
        role: m.role,
      };
    });

  },

  manageMember: async (groupId, memberId, action) => {
    const { data } = await api.post(`/groups/${groupId}/members/${memberId}/manage`, { action });
    return data?.data;
  },

  getGroupMessages: async (groupId) => {
    const { data } = await api.get(`/groups/${groupId}/messages`);
    const list = data?.data ?? [];
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL;
    return list.map((m) => ({
      id: m.id,
      senderId: m.sender_id,
      sender: m.sender_name,
      avatar: m.sender_avatar
        ? m.sender_avatar.startsWith('http') || m.sender_avatar.startsWith('blob:')
          ? m.sender_avatar
          : `${base}${m.sender_avatar}`
        : '/images/default-avatar.png',
      text: m.content,

      file: m.file_url ? (m.file_url.startsWith('http') || m.file_url.startsWith('blob:') || m.file_url.startsWith('data:') ? m.file_url : `${base}${m.file_url}`) : null,
      audio: m.audio_url ? (m.audio_url.startsWith('http') || m.audio_url.startsWith('blob:') || m.audio_url.startsWith('data:') ? m.audio_url : `${base}${m.audio_url}`) : null,

      timestamp: m.sent_at,
    }));
  },


  sendGroupMessage: async (groupId, { text, file, audio }) => {
    const form = new FormData();
    if (text) form.append('message', text);
    if (file) form.append('file', file);
    if (audio) form.append('audio', audio);
    const { data } = await api.post(`/groups/${groupId}/messages`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data?.data;
  },

};

export default groupService;
