import { useState } from 'react';
import ChatImage from '../shared/ChatImage';

const initialMembers = [
  {
    id: '1',
    name: 'Sarah Johnson',
    avatar: 'https://i.pravatar.cc/150?img=1',
    role: 'admin',
  },
  {
    id: '2',
    name: 'Omar Saleh',
    avatar: 'https://i.pravatar.cc/150?img=2',
    role: 'moderator',
  },
  {
    id: '3',
    name: 'Lina Farah',
    avatar: 'https://i.pravatar.cc/150?img=3',
    role: 'member',
  },
];

const roleOptions = ['admin', 'moderator', 'member'];

export default function GroupMembersManager() {
  const [members, setMembers] = useState(initialMembers);

  const handleRoleChange = (id, newRole) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, role: newRole } : m))
    );
  };

  const handleRemove = (id) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">👥 Manage Group Members</h3>
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-3 border rounded shadow-sm bg-white"
        >
          <div className="flex items-center gap-3">
            <ChatImage
              src={member.avatar}
              alt={member.name}
              className="w-10 h-10 rounded-full border"
              width={40}
              height={40}
            />
            <div>
              <p className="font-medium">{member.name}</p>
              <p className="text-xs text-gray-500 capitalize">{member.role}</p>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <select
              value={member.role}
              onChange={(e) => handleRoleChange(member.id, e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>

            {member.role !== 'admin' && (
              <button
                onClick={() => handleRemove(member.id)}
                className="text-sm text-red-500 hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
