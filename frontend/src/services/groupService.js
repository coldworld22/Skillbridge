// ---------------------------------------------
// ✅ MOCK DATA
// ---------------------------------------------

const currentUserId = 'u1'; // Simulate logged-in user (Ali Hassan)

const mockGroup = {
  id: '12345',
  name: 'Frontend Developers',
  description: 'Public group for frontend discussions.',
  isPublic: true,
};

let mockRequests = [
  {
    id: 'req1',
    user: { id: 'u1', name: 'Ali Hassan' },
    group: { id: '12345', name: 'Frontend Developers' },
  },
];

let groupMembersMock = [
  { id: 'u3', name: 'You', role: 'admin', muted: false },
  { id: 'u1', name: 'Ali Hassan', role: 'member', muted: false },
  { id: 'u2', name: 'Sarah Youssef', role: 'moderator', muted: false },
];

let groupPermissions = {
  admin: { message: true, upload: true, video: true, invite: true },
  moderator: { message: true, upload: true, video: true, invite: false },
  member: { message: true, upload: false, video: false, invite: false },
};

const allGroupsMock = [
  {
    id: '12345',
    name: 'Frontend Developers',
    description: 'Public group for frontend discussions.',
    isPublic: true,
  },
  {
    id: 'g2',
    name: 'AI Builders',
    description: 'Discuss machine learning & AI',
    isPublic: true,
  },
  {
    id: 'g3',
    name: 'Private Research Team',
    description: 'Private team for internal collaboration',
    isPublic: false,
  },
];

// ---------------------------------------------
// ✅ SERVICE METHODS
// ---------------------------------------------

const groupService = {
  // ✅ Get specific group by ID
  getGroupById: async (id) => {
    return allGroupsMock.find((g) => g.id === id) || null;
  },

  // ✅ Get all groups (public + private)
  getAllGroups: async () => {
    return allGroupsMock;
  },

  // ✅ Filtered public groups
  getPublicGroups: async () => {
    return allGroupsMock.filter((g) => g.isPublic);
  },

  // ✅ Send join request
  sendJoinRequest: async (groupId) => {
    console.log(`Join request sent to group ${groupId}`);
    const group = allGroupsMock.find((g) => g.id === groupId);
    if (!group) return false;

    mockRequests.push({
      id: `req-${Date.now()}`,
      user: { id: currentUserId, name: 'Test User' },
      group,
    });

    return true;
  },

  // ✅ Admin sees join requests
  getJoinRequestsForAdmin: async () => {
    return mockRequests;
  },

  // ✅ Admin approves or rejects request
  respondToJoinRequest: async (requestId, action) => {
    const request = mockRequests.find((r) => r.id === requestId);

    if (action === 'approve' && request) {
      groupMembersMock.push({
        id: request.user.id,
        name: request.user.name,
        role: 'member',
        muted: false,
      });
    }

    mockRequests = mockRequests.filter((r) => r.id !== requestId);
    console.log(`Request ${requestId} was ${action}`);
    return true;
  },

  // ✅ Get logged-in user's joined groups
  getMyGroups: async () => {
    return groupMembersMock
      .filter((m) => m.id === currentUserId && !m.removed)
      .map((m) => {
        const group = allGroupsMock.find((g) => g.id === '12345'); // Simplified
        return {
          ...group,
          role: m.role,
          status: 'joined',
        };
      });
  },

  // ✅ Get user's pending join requests
  getMyJoinRequests: async () => {
    return mockRequests
      .filter((r) => r.user.id === currentUserId)
      .map((r) => ({
        ...r.group,
        status: 'pending',
      }));
  },

  // ✅ Get members of a group
  getGroupMembers: async (groupId) => {
    return groupMembersMock.filter((m) => !m.removed);
  },

  // ✅ Manage member (kick, mute, promote, etc.)
  manageMember: async (groupId, memberId, action) => {
    console.log(`Performing ${action} on member ${memberId} in group ${groupId}`);

    groupMembersMock = groupMembersMock.map((m) => {
      if (m.id === memberId) {
        switch (action) {
          case 'kick': return { ...m, removed: true };
          case 'mute': return { ...m, muted: true };
          case 'unmute': return { ...m, muted: false };
          case 'promote': return { ...m, role: 'moderator' };
          case 'demote': return { ...m, role: 'member' };
          default: return m;
        }
      }
      return m;
    });

    return true;
  },

  // ✅ Permissions
  getGroupPermissions: async (groupId) => {
    return groupPermissions;
  },

  updateGroupPermissions: async (groupId, updatedPermissions) => {
    groupPermissions = updatedPermissions;
    console.log(`Permissions for group ${groupId} updated`, updatedPermissions);
    return true;
  },
};

export default groupService;
