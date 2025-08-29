import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";

const formatGroup = (g) => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL;
  let tags = [];
  if (g.tags) {
    if (Array.isArray(g.tags)) {
      tags = g.tags;
    } else if (typeof g.tags === "string") {
      try {
        tags = JSON.parse(g.tags);
      } catch {
        tags = [];
      }
    }
  }
  return {
    ...g,
    cover_image: g.cover_image
      ? g.cover_image.startsWith('http') || g.cover_image.startsWith('blob:')
        ? g.cover_image
        : `${base}${g.cover_image}`
      : g.cover_image,
    image: g.image
      ? g.image.startsWith('http') || g.image.startsWith('blob:')
        ? g.image
        : `${base}${g.image}`
      : g.image,
    membersCount: g.members_count ?? g.membersCount ?? 0,
    isPublic: g.visibility ? g.visibility === "public" : (g.isPublic ?? true),
    createdAt: g.created_at ?? g.createdAt,
    categoryId: g.category_id ?? g.categoryId ?? null,
    category: g.category ?? g.category_name ?? null,
    maxSize: g.max_size ?? g.maxSize ?? null,
    timezone: g.timezone ?? null,
    creator: g.creator_name ?? g.creator ?? null,
    creatorRole: g.creator_role ?? g.creatorRole ?? null,
    status: g.status ?? "active",
    contactPhone: g.contact_phone ?? g.contactPhone ?? null,
    phone: g.phone ?? g.contact_phone ?? g.contactPhone ?? null,
    tags,
    offerSummary: g.offerSummary || g.offer_summary || {
      count: g.offer_count ?? 0,
      total_fee: g.total_fee ?? 0,
    },
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
    const { data } = await api.get("/groups", {
      params: { search, status: "active" },
    });
    const list = data?.data ?? [];
    const groups = Array.isArray(list) ? list.map(formatGroup) : list;
    return groups.filter((g) => g.isPublic && g.status === "active");
  },

  getAllGroups: async (search, status) => {
    const { data } = await api.get("/groups", { params: { search, status } });
    const list = data?.data ?? [];
    return Array.isArray(list) ? list.map(formatGroup) : list;
  },

  getGroupById: async (id, opts = {}) => {
    const { data } = await api.get(`/groups/${id}`, opts);
    return data?.data ? formatGroup(data.data) : null;
  },

  joinGroup: async (groupId) => {
    const { data } = await api.post(`/groups/${groupId}/join`);
    return data?.data;
  },

  cancelJoinRequest: async (groupId) => {
    await api.delete(`/groups/${groupId}/join`);
    return true;
  },

  createGroup: async (payload) => {
    const { data } = await api.post("/groups", payload, {
      headers:
        payload instanceof FormData
          ? { "Content-Type": "multipart/form-data" }
          : {},
    });
    return data?.data ? formatGroup(data.data) : null;
  },

  getGroupMembers: async (groupId, opts = {}) => {
    const { data } = await api.get(`/groups/${groupId}/members`, opts);
    const list = data?.data ?? [];

    const base = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL;
    return list.map((m) => {
      const avatar = m.avatar
        ? m.avatar.startsWith("http") || m.avatar.startsWith("blob:")
          ? m.avatar
          : `${base}${m.avatar}`
        : "/images/default-avatar.png";
      return {
        id: m.user_id,
        name: m.name,
        avatar,
        role: m.role,
        disabled: m.disabled ?? false,
      };
    });
  },

  manageMember: async (groupId, memberId, action) => {
    const { data } = await api.post(
      `/groups/${groupId}/members/${memberId}/manage`,
      { action },
    );
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
        ? m.sender_avatar.startsWith("http") ||
          m.sender_avatar.startsWith("blob:")
          ? m.sender_avatar
          : `${base}${m.sender_avatar}`
        : "/images/default-avatar.png",
      text: m.content,

      file: m.file_url
        ? m.file_url.startsWith("http") ||
          m.file_url.startsWith("blob:") ||
          m.file_url.startsWith("data:")
          ? m.file_url
          : `${base}${m.file_url}`
        : null,
      audio: m.audio_url
        ? m.audio_url.startsWith("http") ||
          m.audio_url.startsWith("blob:") ||
          m.audio_url.startsWith("data:")
          ? m.audio_url
          : `${base}${m.audio_url}`
        : null,

      timestamp: m.sent_at,
    }));
  },

  sendGroupMessage: async (
    groupId,
    { text, file, audio, sendEmail, sendWhatsapp },
  ) => {
    const form = new FormData();
    if (text) form.append("message", text);
    if (file) form.append("file", file);
    if (audio) form.append("audio", audio);
    if (sendEmail) form.append("sendEmail", "true");
    if (sendWhatsapp) form.append("sendWhatsapp", "true");
    const { data } = await api.post(`/groups/${groupId}/messages`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data?.data;
  },

  deleteGroupMessage: async (messageId) => {
    const { data } = await api.delete(`/groups/messages/${messageId}`);
    return data?.data ?? data;
  },

  setTypingStatus: async (groupId, typing) => {
    await api.post(`/groups/${groupId}/typing`, { typing });
    return true;
  },

  getTypingStatus: async (groupId) => {
    const { data } = await api.get(`/groups/${groupId}/typing`);
    return data?.data ?? [];
  },

  startGroupVideoCall: async (groupId) => {
    const { data } = await api.post(`/groups/${groupId}/video-call`);
    return data?.data;
  },

  deleteGroup: async (id) => {
    await api.delete(`/groups/${id}`);
    return true;
  },

  updateGroup: async (id, payload) => {
    const { data } = await api.patch(`/groups/${id}`, payload);
    return data?.data ? formatGroup(data.data) : null;
  },

  getJoinRequestsForGroup: async (groupId, opts = {}) => {
    const { data } = await api.get(`/groups/${groupId}/requests`, opts);
    const list = data?.data ?? [];
    return Array.isArray(list)
      ? list.map((r) => ({
          id: r.id,
          userId: r.user_id,
          name: r.name,
          email: r.email,
          requestedAt: r.requested_at,
        }))
      : [];
  },

  approveRequest: async (requestId) => {
    await api.post(`/groups/requests/${requestId}`, { action: "approve" });
    return true;
  },

  rejectRequest: async (requestId) => {
    await api.post(`/groups/requests/${requestId}`, { action: "reject" });
    return true;
  },

  getGroupPermissions: async (groupId) => {
    const { data } = await api.get(`/groups/${groupId}/permissions`);
    return data?.data ?? {};
  },

  updateGroupPermissions: async (groupId, payload) => {
    const { data } = await api.put(`/groups/${groupId}/permissions`, payload);
    return data?.data;
  },
};

export default groupService;
