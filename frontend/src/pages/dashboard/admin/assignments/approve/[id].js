// pages/dashboard/admin/assignments/approve/[id].js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layouts/AdminLayout';
import { FaCheckCircle } from 'react-icons/fa';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../../../../next-i18next.config.js';
import {
  fetchAssignmentById,
  approveAssignment,
} from '@/services/admin/assignmentService';

export default function ApproveAssignmentPage() {
  const router = useRouter();
  const { id } = router.query;
  const [assignment, setAssignment] = useState(null);
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

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await approveAssignment(id);
      alert('✅ Assignment approved successfully!');
      router.push('/dashboard/admin/assignments/success');
    } catch (err) {
      alert('Failed to approve assignment.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="text-center mt-32 text-gray-700">Loading...</div>;
  if (error) return <div className="text-center mt-32 text-red-500">{error}</div>;

  return (
    <AdminLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-yellow-500 mb-8">✅ Approve Assignment</h1>

          <div className="bg-gray-100 p-6 rounded-xl shadow-md space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">{assignment.title}</h2>
              <p><strong>Instructor:</strong> {assignment.instructor}</p>
              <p><strong>Class:</strong> {assignment.className}</p>
              <p><strong>Due Date:</strong> {new Date(assignment.dueDate).toLocaleString()}</p>
            </div>

            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FaCheckCircle /> Confirm Approve
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ['common', 'dashboard'],
        nextI18NextConfig
      )),
    },
  };
}
