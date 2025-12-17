// pages/dashboard/student/assignments/index.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaClipboardList, FaClock, FaFileUpload, FaBookOpen } from 'react-icons/fa';
import StudentLayout from '@/components/layouts/StudentLayout';
import { fetchMyClassAssignments } from '@/services/classService';

export default function AssignmentDashboard() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAssignments = async () => {
      setLoading(true);
      try {
        const grouped = await fetchMyClassAssignments();
        const list = grouped.flatMap(({ className, assignments }) =>
          (assignments || []).map((a) => ({ ...a, className }))
        );
        setAssignments(list);
      } catch (err) {
        console.error('Failed to load assignments', err);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };
    loadAssignments();
  }, []);

  return (
    <StudentLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <h1 className="text-2xl font-bold text-yellow-500 mb-6">📚 My Assignments</h1>
        {loading ? (
          <p className="text-center text-gray-500 mt-10">Loading assignments...</p>
        ) : assignments.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">No assignments available right now.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="bg-gray-100 p-5 rounded-xl shadow-md flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800">
                    <FaClipboardList className="text-yellow-500" /> {assignment.title}
                  </h2>
                  {assignment.className && (
                    <p className="text-sm text-gray-600 flex items-center gap-2 mb-2">
                      <FaBookOpen className="text-gray-400" /> {assignment.className}
                    </p>
                  )}
                  {(assignment.due_date || assignment.dueDate) && (
                    <p className="text-sm text-gray-600 flex items-center gap-2 mb-2">
                      <FaClock /> Due: {new Date(assignment.due_date || assignment.dueDate).toLocaleString()}
                    </p>
                  )}
                  {assignment.status && (
                    <span
                      className={`inline-block px-3 py-1 text-xs font-medium rounded-full mb-4 ${
                        assignment.status === 'Graded'
                          ? 'bg-green-100 text-green-800'
                          : assignment.status === 'Submitted'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {assignment.status} {assignment.grade && `| Grade: ${assignment.grade}`}
                    </span>
                  )}
                </div>
                <Link
                  href={`/dashboard/student/assignments/${assignment.id}`}
                  className="mt-4 block bg-yellow-500 text-black text-center py-2 px-4 rounded hover:bg-yellow-600 font-semibold"
                >
                  <FaFileUpload className="inline mr-2" /> View / Upload
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}