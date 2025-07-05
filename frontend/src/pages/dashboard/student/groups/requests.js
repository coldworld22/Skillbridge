import StudentLayout from '@/components/layouts/StudentLayout';
import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import groupService from '@/services/groupService';

export default function JoinRequestsPage() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    groupService
      .getMyGroups()
      .then((list) => {
        setRequests(list.filter((g) => g.role === 'pending'));
      })
      .catch(() => setRequests([]));
  }, []);
  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <h1 className="text-2xl font-bold">📩 My Join Requests</h1>

        {requests.length === 0 ? (
          <p className="text-gray-500">You haven’t sent any join requests yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {requests.map((group) => (
              <div key={group.id} className="p-4 bg-white rounded-xl shadow space-y-2 border">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold">{group.name}</h2>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded flex items-center gap-1">
                    <Clock size={14} /> Pending
                  </span>
                </div>
                <p className="text-sm text-gray-600">{group.description}</p>
                <button
                  disabled
                  className="mt-2 w-full px-4 py-2 rounded bg-gray-300 cursor-not-allowed"
                >
                  Awaiting Approval
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
