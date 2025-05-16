// pages/dashboard/admin/assignments/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layouts/AdminLayout';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

export default function AdminAssignmentReviewPage() {
  const router = useRouter();
  const { id } = router.query;

  const [assignment, setAssignment] = useState(null);
  const [actionNote, setActionNote] = useState('');
  const [status, setStatus] = useState('Pending');

  useEffect(() => {
    // Mock fetch assignment
    setAssignment({
      id,
      title: 'React State Management',
      instructor: 'Ayman Khalid',
      className: 'React & Next.js Bootcamp',
      type: 'mcq',
      allowLate: true,
      dueDate: '2025-05-30T23:59:00Z',
      gradingRubric: 'Focus on correct hook usage, clear logic, and no unnecessary re-renders.',
      questions: [
        {
          question: 'Which hook is used to manage component state?',
          options: ['useEffect', 'useState', 'useContext', 'useMemo'],
          correct: 1,
          points: 2
        }
      ]
    });
  }, [id]);

  const handleApprove = () => {
    setStatus('Approved');
    alert('✅ Assignment Approved Successfully!');
    // TODO: Save the action in backend later
  };

  const handleReject = () => {
    if (!actionNote.trim()) {
      alert('⚠️ Please provide a reason for rejection.');
      return;
    }
    setStatus('Rejected');
    alert('❌ Assignment Rejected and Instructor Notified.');
    // TODO: Save the action in backend later
  };

  if (!assignment) return <div className="text-center mt-32 text-gray-700">Loading...</div>;

  return (
    <AdminLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-yellow-500 mb-8">📄 Review Assignment</h1>

          <div className="bg-gray-100 p-6 rounded-xl shadow-md space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold">{assignment.title}</h2>
                <p className="text-sm text-gray-500">{assignment.className}</p>
              </div>
              <span className={`px-4 py-1 rounded-full text-sm font-bold ${
                status === 'Approved' ? 'bg-green-100 text-green-700' :
                status === 'Rejected' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {status}
              </span>
            </div>

            {/* Assignment Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><strong>Instructor:</strong> {assignment.instructor}</div>
              <div><strong>Type:</strong> {assignment.type.toUpperCase()}</div>
              <div><strong>Due Date:</strong> {new Date(assignment.dueDate).toLocaleString()}</div>
              <div><strong>Allow Late:</strong> {assignment.allowLate ? 'Yes' : 'No'}</div>
            </div>

            {/* Grading Rubric */}
            {assignment.gradingRubric && (
              <div>
                <h3 className="font-semibold text-lg mt-4">📝 Grading Rubric:</h3>
                <p className="text-sm text-gray-700 mt-1">{assignment.gradingRubric}</p>
              </div>
            )}

            {/* MCQ Questions */}
            {assignment.type === 'mcq' && assignment.questions.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mt-6 mb-2">✅ MCQ Questions</h3>
                <ul className="space-y-4">
                  {assignment.questions.map((q, idx) => (
                    <li key={idx} className="bg-white p-4 rounded-lg shadow-sm border">
                      <p className="font-medium">{idx + 1}. {q.question}</p>
                      <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
                        {q.options.map((opt, i) => (
                          <li key={i} className={q.correct === i ? 'text-green-600 font-semibold' : ''}>
                            {opt} {q.correct === i && '(Correct)'}
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-gray-400 mt-1">Points: {q.points}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Admin Action Area */}
            {status === 'Pending' && (
              <div className="space-y-4 pt-4 border-t">
                <textarea
                  placeholder="Add a note (reason if rejecting, optional if approving)"
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  className="w-full p-3 bg-gray-200 rounded-md resize-none"
                  rows="4"
                />

                <div className="flex gap-4">
                  <button
                    onClick={handleApprove}
                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                  >
                    <FaCheckCircle /> Approve
                  </button>

                  <button
                    onClick={handleReject}
                    className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                  >
                    <FaTimesCircle /> Reject
                  </button>
                </div>
              </div>
            )}

            {/* Approved/Rejected Message */}
            {status !== 'Pending' && (
              <p className="mt-6 text-center text-sm text-gray-600">
                Assignment review completed. {status === 'Rejected' && actionNote && (
                  <> <br /> <strong>Rejection Note:</strong> {actionNote} </>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
