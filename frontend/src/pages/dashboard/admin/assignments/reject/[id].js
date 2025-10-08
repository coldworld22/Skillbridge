// pages/dashboard/admin/assignments/reject/[id].js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layouts/AdminLayout';
import { FaTimesCircle } from 'react-icons/fa';
import {
  fetchAssignmentById,
  rejectAssignment,
} from '@/services/admin/assignmentService';

export default function RejectAssignmentPage() {
  const router = useRouter();
  const { id } = router.query;

  const [assignment, setAssignment] = useState(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAssignmentById(id);
        setAssignment(data);
      } catch (err) {
        setError('Failed to load assignment.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleReject = async () => {
    if (!reason.trim()) {
      alert('⚠️ Please provide a reason for rejection.');
      return;
    }
    setActionLoading(true);
    try {
      await rejectAssignment(id, reason);
      alert(`❌ Assignment "${assignment.title}" rejected successfully with reason: ${reason}`);
      router.push('/dashboard/admin/assignments');
    } catch (err) {
      alert('Failed to reject assignment.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="text-center mt-32 text-gray-700">Loading...</div>;
  if (error) return <div className="text-center mt-32 text-red-500">{error}</div>;

  return (
    <AdminLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <div className="max-w-2xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold text-red-500">🚫 Reject Assignment</h1>

          <div className="bg-gray-100 p-6 rounded-xl shadow-md space-y-4">
            <p><strong>Assignment:</strong> {assignment.title}</p>
            <p><strong>Instructor:</strong> {assignment.instructor}</p>
            <p><strong>Class:</strong> {assignment.className}</p>

            <textarea
              placeholder="Write reason for rejection..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-4 bg-gray-200 rounded resize-none h-32"
            />

            <div className="flex gap-4">
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FaTimesCircle /> Reject Assignment
              </button>

              <button
                onClick={() => router.back()}
                className="w-full py-3 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
