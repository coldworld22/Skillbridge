// pages/dashboard/admin/assignments/index.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/layouts/AdminLayout';
import { FaSearch, FaSync, FaEye, FaTrash, FaCheckCircle, FaTimesCircle, FaEdit } from 'react-icons/fa';

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    // Mocked Data
    setAssignments([
      {
        id: 'a1',
        title: 'React Basics',
        instructor: 'Ayman Khalid',
        className: 'React Bootcamp',
        type: 'MCQ',
        dueDate: '2025-05-25T23:59:00Z',
        status: 'Pending'
      },
      {
        id: 'a2',
        title: 'CSS Challenge',
        instructor: 'Sara Ali',
        className: 'Frontend Mastery',
        type: 'Text',
        dueDate: '2025-06-01T23:59:00Z',
        status: 'Approved'
      },
    ]);
  }, []);

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.instructor.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || a.status.toLowerCase() === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-yellow-500 mb-8">📋 Manage Assignments</h1>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-8 items-center">
            <input
              type="text"
              placeholder="Search by title or instructor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] p-2 rounded border bg-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 rounded border bg-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-full"
            >
              <FaSync /> Refresh
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto bg-gray-50 rounded-xl shadow-md">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-200 text-gray-700">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold">Title</th>
                  <th className="p-4 text-left text-sm font-semibold">Class</th>
                  <th className="p-4 text-left text-sm font-semibold">Instructor</th>
                  <th className="p-4 text-left text-sm font-semibold">Type</th>
                  <th className="p-4 text-left text-sm font-semibold">Due Date</th>
                  <th className="p-4 text-left text-sm font-semibold">Status</th>
                  <th className="p-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                {filteredAssignments.map(a => (
                  <tr key={a.id} className="border-t hover:bg-gray-100 transition">
                    <td className="p-4">{a.title}</td>
                    <td className="p-4">{a.className}</td>
                    <td className="p-4">{a.instructor}</td>
                    <td className="p-4">{a.type}</td>
                    <td className="p-4">{new Date(a.dueDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        a.status === 'Approved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="p-4 flex gap-3 items-center">
                      <Link href={`/dashboard/admin/assignments/view/${a.id}`} className="text-blue-500 hover:text-blue-700" title="View Details">
                        <FaEye />
                      </Link>

                      <Link href={`/dashboard/admin/assignments/approve/${a.id}`} className="text-green-500 hover:text-green-700" title="Approve">
                        <FaCheckCircle />
                      </Link>

                      <Link href={`/dashboard/admin/assignments/edit/${a.id}`} className="text-gray-600 hover:text-gray-800" title="Edit">
                        <FaEdit />
                      </Link>

                      <Link href={`/dashboard/admin/assignments/delete/${a.id}`} className="text-red-600 hover:text-red-800" title="Delete">
                        <FaTrash />
                      </Link>

                      <Link href={`/dashboard/admin/assignments/reject/${a.id}`} className="text-red-400 hover:text-red-600" title="Reject">
                        <FaTimesCircle />
                      </Link>
                    </td>
                  </tr>
                ))}
                {filteredAssignments.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-400">
                      No assignments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
