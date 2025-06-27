import React from 'react';
import ChatImage from '../shared/ChatImage';

const mockMembers = [
  {
    id: 1,
    name: 'Sarah Johnson',
    avatar: 'https://i.pravatar.cc/150?img=1',
    role: 'admin',
  },
  {
    id: 2,
    name: 'Ali Mansour',
    avatar: 'https://i.pravatar.cc/150?img=2',
    role: 'member',
  },
  {
    id: 3,
    name: 'Lina Farah',
    avatar: 'https://i.pravatar.cc/150?img=3',
    role: 'pending',
  },
];

const roleStyles = {
  admin: 'bg-green-100 text-green-700',
  member: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
};

export default function GroupMembersList({ members = mockMembers }) {
  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between bg-white p-3 rounded shadow-sm border"
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
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${roleStyles[member.role]}`}
              >
                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
              </span>
            </div>
          </div>

          {/* Optional actions for admin */}
          {member.role === 'pending' && (
            <div className="flex gap-2">
              <button className="text-xs text-green-600 hover:underline">Approve</button>
              <button className="text-xs text-red-500 hover:underline">Reject</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
