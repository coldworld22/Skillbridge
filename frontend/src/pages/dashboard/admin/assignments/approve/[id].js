// pages/dashboard/admin/assignments/approve/[id].js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layouts/AdminLayout';
import { FaCheckCircle } from 'react-icons/fa';

export default function ApproveAssignmentPage() {
  const router = useRouter();
  const { id } = router.query;
  const [assignment, setAssignment] = useState(null);

  useEffect(() => {
    // Mock fetch assignment by ID
    setAssignment({
      id,
      title: 'React State Management',
      instructor: 'Ayman Khalid',
      className: 'React & Next.js Bootcamp',
      dueDate: '2025-05-30T23:59:00Z',
    });
  }, [id]);

  const handleApprove = () => {
    alert('✅ Assignment approved successfully!');
    router.push('/dashboard/admin/assignments/success');
  };

  if (!assignment) return <div className="text-center mt-32 text-gray-700">Loading...</div>;

  return (
    <AdminLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-yellow-500 mb-8">✅ Approve Assignment</h1>

          <div className="bg-gray-100 p-6 rounded-xl shadow-md space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">{assignment.title}</h2>
              <p><strong>Instructor:</strong> {assignment.instructor}</p>
              <p><strong>Class:</strong> {assignment.class}</p>
              <p><strong>Due Date:</strong> {new Date(assignment.dueDate).toLocaleString()}</p>
            </div>

            <button
              onClick={handleApprove}
              className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"
            >
              <FaCheckCircle /> Confirm Approve
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
