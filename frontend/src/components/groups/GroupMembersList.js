import { useEffect, useState } from 'react';
import groupService from '@/services/groupService';
import { FaUserSlash, FaVolumeMute, FaUserShield } from 'react-icons/fa';

export default function GroupMembersList({
  groupId,
  currentUserId,

  canManage = false,

}) {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    groupService.getGroupMembers(groupId).then(setMembers);
  }, [groupId]);

  const handleAction = async (memberId, action) => {
    const success = await groupService.manageMember(groupId, memberId, action);
    if (success) {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId
            ? { ...m, ...getUpdatedRoleOrStatus(m, action) }
            : m
        )
      );
    }
  };

  const getUpdatedRoleOrStatus = (member, action) => {
    switch (action) {
      case 'kick':
        return { removed: true };
      case 'mute':
        return { muted: true };
      case 'unmute':
        return { muted: false };
      case 'promote':
        return { role: 'moderator' };
      case 'demote':
        return { role: 'member' };
      default:
        return {};
    }
  };

  return (
    <div>
      <h3 className="font-semibold mb-2">👥 Group Members</h3>
      <ul className="space-y-2">
        {members
          .filter((m) => !m.removed)
          .map((member) => (
            <li key={member.id} className="flex items-center justify-between text-sm border-b pb-2">
              <div>
                <strong>{member.name}</strong>
                <span className="text-xs ml-2 text-gray-500">({member.role})</span>
                {member.muted && <span className="ml-1 text-red-400">[Muted]</span>}
              </div>

              {member.id !== currentUserId && canManage && (

                  <div className="flex gap-2">
                    <button
                      title="Kick"
                      onClick={() => handleAction(member.id, 'kick')}
                      className="text-red-500 hover:text-red-600"
                    >
                    <FaUserSlash />
                  </button>
                  <button
                    title={member.muted ? "Unmute" : "Mute"}
                    onClick={() => handleAction(member.id, member.muted ? 'unmute' : 'mute')}
                    className="text-yellow-500 hover:text-yellow-600"
                  >
                    <FaVolumeMute />
                  </button>
                  <button
                    title={member.role === 'moderator' ? "Demote" : "Promote to Moderator"}
                    onClick={() => handleAction(member.id, member.role === 'moderator' ? 'demote' : 'promote')}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    <FaUserShield />
                  </button>
                  </div>
                )}
              </li>
            ))}
      </ul>
    </div>
  );
}
