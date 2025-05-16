import { useState } from 'react';

const mockPendingRequests = [
  {
    id: 'u1',
    name: 'Omar Saleh',
    avatar: 'https://i.pravatar.cc/150?img=4',
    requestedAt: '2h ago',
  },
  {
    id: 'u2',
    name: 'Leila Hassan',
    avatar: 'https://i.pravatar.cc/150?img=5',
    requestedAt: '5h ago',
  },
];

export default function PendingJoinRequests({ onApprove, onReject }) {
  const [requests, setRequests] = useState(mockPendingRequests);

  const handleApprove = (id) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    onApprove?.(id);
  };

  const handleReject = (id) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    onReject?.(id);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">🕓 Pending Join Requests</h3>
      {requests.length === 0 ? (
        <p className="text-sm text-gray-500">No pending requests.</p>
      ) : (
        requests.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-3 border rounded shadow-sm bg-white"
          >
            <div className="flex items-center gap-3">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full border"
              />
              <div>
                <p className="font-medium">{user.name}</p>
                <span className="text-xs text-gray-400">{user.requestedAt}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(user.id)}
                className="text-sm text-green-600 hover:underline"
              >
                Approve
              </button>
              <button
                onClick={() => handleReject(user.id)}
                className="text-sm text-red-500 hover:underline"
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
