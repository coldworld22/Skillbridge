import { useState, useEffect } from 'react';
import ChatImage from '../shared/ChatImage';
import groupService from '@/services/groupService';

export default function PendingJoinRequests({ groupId, onApprove, onReject }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!groupId) return;
    let isMounted = true;
    groupService
      .getJoinRequestsForGroup(groupId)
      .then((data) => {
        if (isMounted) setRequests(data);
      })
      .catch(() => isMounted && setError('Failed to load requests'))
      .finally(() => isMounted && setLoading(false));
    return () => {
      isMounted = false;
    };
  }, [groupId]);

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
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-gray-500">No pending requests.</p>
      ) : (
        requests.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-3 border rounded shadow-sm bg-white"
          >
            <div className="flex items-center gap-3">
              <ChatImage
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full border"
                width={40}
                height={40}
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
