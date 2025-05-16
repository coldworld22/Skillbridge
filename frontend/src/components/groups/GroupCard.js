import { useState } from 'react';
import groupService from '@/services/groupService';

export default function GroupCard({ group }) {
  const [requested, setRequested] = useState(false);

  const handleJoin = async () => {
    await groupService.sendJoinRequest(group.id);
    setRequested(true);
  };

  return (
    <div className="border p-4 rounded shadow bg-white space-y-2">
      <h2 className="text-lg font-bold">{group.name}</h2>
      <p className="text-gray-600">{group.description}</p>
      <p className="text-sm text-blue-600">
        {group.tags?.join(', ')}
      </p>
      <button
        onClick={handleJoin}
        disabled={requested}
        className={`px-4 py-2 rounded ${requested ? 'bg-gray-400' : 'bg-blue-600 text-white'}`}
      >
        {requested ? 'Request Sent' : 'Join Group'}
      </button>
    </div>
  );
}
