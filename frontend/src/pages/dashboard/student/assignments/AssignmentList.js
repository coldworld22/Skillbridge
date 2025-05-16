// pages/assignments/AssignmentList.js
import { useEffect, useState } from 'react';
import StudentLayout from '@/components/layouts/StudentLayout';
import Link from 'next/link';
import { FaClipboardList, FaUpload, FaClock } from 'react-icons/fa';

export default function AssignmentList() {
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    // Mocked data - replace with API call
    setAssignments([
      {
        id: 'assign-101',
        title: 'React Components Deep Dive',
        dueDate: '2025-05-30T23:59:00',
        submitted: false,
      },
      {
        id: 'assign-102',
        title: 'Design a Figma Prototype',
        dueDate: '2025-06-05T18:00:00',
        submitted: true,
      },
    ]);
  }, []);

  return (
    <StudentLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <h1 className="text-2xl font-bold text-yellow-500 mb-6">📄 Assignment List</h1>

        {assignments.length === 0 ? (
          <p className="text-gray-600">No assignments found.</p>
        ) : (
          <div className="space-y-4">
            {assignments.map((a) => (
              <div
                key={a.id}
                className="bg-gray-100 p-4 rounded-lg shadow flex justify-between items-center"
              >
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FaClipboardList className="text-yellow-500" /> {a.title}
                  </h2>
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <FaClock /> Due: {new Date(a.dueDate).toLocaleString()}
                  </p>
                </div>
                <Link
                  href={`/assignments/upload?id=${a.id}`}
                  className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
                    a.submitted
                      ? 'bg-green-200 text-green-800 cursor-default pointer-events-none'
                      : 'bg-yellow-500 text-black hover:bg-yellow-600'
                  }`}
                >
                  {a.submitted ? 'Submitted' : (
                    <><FaUpload className="inline mr-1" /> Submit</>
                  )}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
