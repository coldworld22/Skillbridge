// pages/dashboard/instructor/assignments/index.js
import { useEffect, useState } from 'react';
import InstructorLayout from '@/components/layouts/InstructorLayout';
import Link from 'next/link';
import { FaPlus, FaEye, FaEdit, FaTrashAlt } from 'react-icons/fa';
import { fetchInstructorClasses } from '@/services/instructor/classService';
import { fetchClassAssignments } from '@/services/classService';

export default function InstructorAssignmentsAll() {
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const classes = await fetchInstructorClasses();
        const all = [];
        for (const cls of classes) {
          const list = await fetchClassAssignments(cls.id);
          list.forEach((a) => all.push({ ...a, classId: cls.id }));
        }
        setAssignments(all);
      } catch (err) {
        console.error('Failed to load assignments', err);
      }
    };
    load();
  }, []);

  return (
    <InstructorLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-yellow-500">📋 All Assignments</h1>
          <Link href="/dashboard/instructor/assignments/create" className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2 rounded-full flex items-center gap-2">
            <FaPlus /> Create Assignment
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Class</th>
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
                  <td className="p-3">
                    <Link href={`/dashboard/instructor/assignments/${a.classId}`} className="text-yellow-600 hover:underline">
                      {a.classId}
                    </Link>
                  </td>
                  <td className="p-3">{a.due_date ? new Date(a.due_date).toLocaleString() : ''}</td>
                  <td className="p-3">{a.type || '-'}</td>
                  <td className="p-3">{a.status || '-'}</td>
                  <td className="p-3 flex gap-2">
                    <Link href={`/dashboard/instructor/assignments/view/${a.id}`} className="text-blue-600 hover:text-blue-800"><FaEye /></Link>
                    <Link href={`/dashboard/instructor/assignments/edit/${a.id}`} className="text-gray-600 hover:text-gray-800"><FaEdit /></Link>
                    <button className="text-red-600 hover:text-red-800"><FaTrashAlt /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </InstructorLayout>
  );
}
