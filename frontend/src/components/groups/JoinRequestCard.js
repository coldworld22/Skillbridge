import { useEffect, useState } from 'react';
import groupService from '@/services/groupService';

export default function JoinRequestCard({ groupId, onCountChange }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      const data = await groupService.getJoinRequestsForGroup(groupId);
      setRequests(data);
      setLoading(false);
      if (onCountChange) onCountChange(data.length);
    };
    fetchRequests();
  }, [groupId]);

  const handleAction = async (id, action) => {
    if (action === 'approve') await groupService.approveRequest(id);
    else await groupService.rejectRequest(id);

    setRequests(prev => {
      const next = prev.filter(r => r.id !== id);
      if (onCountChange) onCountChange(next.length);
      return next;
    });
  };

  if (loading) return <p>Loading join requests...</p>;
  if (requests.length === 0) return <p>No pending requests.</p>;

  return (
    <div className="bg-white p-4 rounded shadow space-y-3">
      {requests.map(req => (
        <div key={req.id} className="flex justify-between items-center border-b pb-2">
          <span>{req.name}</span>
          <div className="space-x-2">
            <button
              onClick={() => handleAction(req.id, 'approve')}
              className="text-green-600 hover:underline"
            >
              Approve
            </button>
            <button
              onClick={() => handleAction(req.id, 'reject')}
              className="text-red-600 hover:underline"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
