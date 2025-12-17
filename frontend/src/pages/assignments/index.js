// src/pages/assignments/index.js
import { useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import AssignmentList from '@/components/assignments/AssignmentList';
import AssignmentUpload from './AssignmentUpload';

const mockAssignments = [
  {
    id: 1,
    title: 'Week 1 Homework',
    description: 'Solve the given problems on JSX and Components.',
    dueDate: '2025-05-05',
    classId: 'react-bootcamp',
    uploadedBy: 'instructor',
  },
  {
    id: 2,
    title: 'Week 2 Project',
    description: 'Build a ToDo App with state management.',
    dueDate: '2025-05-12',
    classId: 'react-bootcamp',
    uploadedBy: 'instructor',
  },
];

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState(mockAssignments);
  const [userRole, setUserRole] = useState('admin'); // Change to 'instructor' or 'student' to simulate roles

  const addAssignment = (newAssignment) => {
    setAssignments((prev) => [...prev, { ...newAssignment, id: Date.now() }]);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📚 Assignments</h1>
          <p className="text-sm text-gray-500">Upload, view, and manage assignments across classes.</p>
        </div>
        {(userRole === 'admin' || userRole === 'instructor') && (
          <span className="text-sm text-gray-500">Logged in as: <strong>{userRole}</strong></span>
        )}
      </div>

      {(userRole === 'admin' || userRole === 'instructor') && (
        <div className="mb-6">
          <AssignmentUpload onUpload={addAssignment} />
        </div>
      )}

      <AssignmentList
        assignments={assignments.filter((a) =>
          userRole === 'student' ? a.classId === 'react-bootcamp' : true
        )}
        userRole={userRole}
      />
    </div>
  );
}

AssignmentsPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};