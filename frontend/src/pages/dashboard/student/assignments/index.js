// pages/dashboard/student/assignments/index.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaClipboardList, FaCheckCircle, FaClock, FaFileUpload, FaBookOpen } from 'react-icons/fa';
import StudentLayout from '@/components/layouts/StudentLayout';

export default function AssignmentDashboard() {
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    setAssignments([
      {
        id: 'a1',
        title: 'React Basics',
        dueDate: '2025-05-25T23:59:00Z',
        status: 'Pending',
        className: 'React Bootcamp'
      },
      {
        id: 'a2',
        title: 'CSS Challenge',
        dueDate: '2025-05-15T23:59:00Z',
        status: 'Submitted',
        className: 'Frontend Mastery'
      },
      {
        id: 'a3',
        title: 'API Integration',
        dueDate: '2025-05-10T23:59:00Z',
        status: 'Graded',
        grade: 'A+',
        className: 'Next.js Fullstack'
      },
    ]);
  }, []);

  return (
    <StudentLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <h1 className="text-2xl font-bold text-yellow-500 mb-6">📚 My Assignments</h1>

        {assignments.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">No assignments available right now.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="bg-gray-100 p-5 rounded-xl shadow-md flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800">
                    <FaClipboardList className="text-yellow-500" /> {assignment.title}
                  </h2>
                  <p className="text-sm text-gray-600 flex items-center gap-2 mb-2">
                    <FaBookOpen className="text-gray-400" /> {assignment.className}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-2 mb-2">
                    <FaClock /> Due: {new Date(assignment.dueDate).toLocaleString()}
                  </p>
                  <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mb-4 ${assignment.status === 'Graded' ? 'bg-green-100 text-green-800' : assignment.status === 'Submitted' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {assignment.status} {assignment.grade && `| Grade: ${assignment.grade}`}
                  </span>
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