// src/pages/assignments/index.js
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import AssignmentList from '@/components/assignments/AssignmentList';
import AssignmentUpload from './AssignmentUpload';
import { assignmentMocks } from '@/mocks/data';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [userRole, setUserRole] = useState('admin'); // Change to 'instructor' or 'student' to simulate roles

  useEffect(() => {
    async function loadAssignments() {
      if (process.env.NODE_ENV === 'development') {
        setAssignments(assignmentMocks);
        return;
      }
      // Real assignments are retrieved from the API, e.g.:
      // const data = await fetchClassAssignments(classId);
      // setAssignments(data);
    }
    loadAssignments();
  }, []);

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