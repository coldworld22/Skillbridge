// pages/dashboard/admin/assignments/reject/[id].js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layouts/AdminLayout';
import { FaTimesCircle } from 'react-icons/fa';

export default function RejectAssignmentPage() {
  const router = useRouter();
  const { id } = router.query;

  const [assignment, setAssignment] = useState(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    // Mock assignment fetch
    setAssignment({
      id,
      title: 'React Basics',
      instructor: 'Ayman Khalid',
      className: 'React Bootcamp',
    });
  }, [id]);

  const handleReject = () => {
    if (!reason.trim()) {
      alert('⚠️ Please provide a reason for rejection.');
      return;
    }

    // TODO: Save rejection reason and update status
    alert(`❌ Assignment "${assignment.title}" rejected successfully with reason: ${reason}`);
    router.push('/dashboard/admin/assignments');
  };

  if (!assignment) return <div className="text-center mt-32 text-gray-700">Loading...</div>;

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
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded flex items-center justify-center gap-2"
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
