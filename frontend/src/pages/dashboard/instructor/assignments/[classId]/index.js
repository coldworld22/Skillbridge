// pages/dashboard/instructor/assignments/[classId]/index.js

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import InstructorLayout from '@/components/layouts/InstructorLayout';
import Link from 'next/link';
import { FaEdit, FaTrashAlt, FaEye, FaPlusCircle } from 'react-icons/fa';
import { fetchClassAssignments } from '@/services/classService';
import { deleteClassAssignment } from '@/services/instructor/classService';

export default function ClassAssignmentsPage() {
  const router = useRouter();
  const { classId } = router.query;

  const [assignments, setAssignments] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && classId) {
      const load = async () => {
        try {
          const list = await fetchClassAssignments(classId);
          setAssignments(list);
        } catch (err) {
          console.error('Failed to load assignments', err);
        }
      };
      load();
    }
  }, [mounted, classId]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await deleteClassAssignment(id);
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Failed to delete assignment', err);
    }
  };

  if (!mounted) return null;
  if (!classId) return <div className="text-white p-10">Loading class assignments...</div>;

  return (
    <InstructorLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-yellow-500">📋 Assignments for {classId}</h1>
          <Link
            href={`/dashboard/instructor/assignments/create?classId=${classId}`}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-full font-bold"
          >
            <FaPlusCircle /> Create Assignment
          </Link>
        </div>

        {assignments.length === 0 ? (
          <p className="text-center text-gray-500">No assignments found for this class.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-3 text-left">Title</th>
                  <th className="p-3 text-left">Due Date</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="p-3">{a.title}</td>
                    <td className="p-3">{a.due_date ? new Date(a.due_date).toLocaleString() : ''}</td>
                    <td className="p-3">{a.type || '-'}</td>
                    <td className="p-3">{a.status || '-'}</td>
                    <td className="p-3 flex gap-2">
                      <Link href={`/dashboard/instructor/assignments/view/${a.id}`} className="text-gray-600 hover:text-gray-800">
                        <FaEye />
                      </Link>
                      <Link href={`/dashboard/instructor/assignments/edit/${a.id}`} className="text-blue-600 hover:text-blue-800">
                        <FaEdit />
                      </Link>
                      <button onClick={() => handleDelete(a.id)} className="text-red-600 hover:text-red-800">
                        <FaTrashAlt />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}
