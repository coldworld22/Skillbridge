// pages/dashboard/admin/assignments/edit/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layouts/AdminLayout';
import { FaSave, FaArrowLeft } from 'react-icons/fa';

export default function EditAssignmentPage() {
  const router = useRouter();
  const { id } = router.query;

  const [assignment, setAssignment] = useState(null);

  useEffect(() => {
    // Mock fetch assignment data
    setAssignment({
      id,
      title: 'React State Management',
      description: 'Assignment to test useState and useReducer usage.',
      type: 'mcq',
      dueDate: '2025-06-01T23:59:00Z',
      allowLate: true,
      gradingRubric: 'Code cleanliness, proper hook usage, optimized performance.',
      questions: [
        {
          question: 'Which hook is used for managing component state?',
          options: ['useEffect', 'useState', 'useMemo', 'useContext'],
          correct: 1,
          points: 2
        }
      ]
    });
  }, [id]);

  const handleSave = () => {
    alert('✅ Assignment changes saved successfully! (mock)');
    router.push('/dashboard/admin/assignments');
  };

  if (!assignment) return <div className="text-center mt-32 text-gray-700">Loading...</div>;

  return (
    <AdminLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <div className="max-w-3xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold text-yellow-500">✍️ Edit Assignment</h1>

          <div className="bg-gray-100 p-6 rounded-xl shadow-md space-y-6">
            <input
              type="text"
              value={assignment.title}
              onChange={(e) => setAssignment({ ...assignment, title: e.target.value })}
              placeholder="Assignment Title"
              className="w-full p-3 bg-white border rounded"
            />

            <textarea
              value={assignment.description}
              onChange={(e) => setAssignment({ ...assignment, description: e.target.value })}
              placeholder="Assignment Description"
              className="w-full p-3 h-32 bg-white border rounded"
            ></textarea>

            <input
              type="datetime-local"
              value={assignment.dueDate}
              onChange={(e) => setAssignment({ ...assignment, dueDate: e.target.value })}
              className="w-full p-3 bg-white border rounded"
            />

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={assignment.allowLate}
                onChange={(e) => setAssignment({ ...assignment, allowLate: e.target.checked })}
              />
              <label>Allow Late Submissions</label>
            </div>

            {assignment.type === 'mcq' && assignment.questions.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold mt-4 mb-2">✅ Edit MCQ Questions</h2>
                {assignment.questions.map((q, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 border rounded space-y-2">
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => {
                        const newQs = [...assignment.questions];
                        newQs[idx].question = e.target.value;
                        setAssignment({ ...assignment, questions: newQs });
                      }}
                      placeholder={`Question ${idx + 1}`}
                      className="w-full p-2 bg-white border rounded"
                    />
                    {q.options.map((opt, optIdx) => (
                      <input
                        key={optIdx}
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newQs = [...assignment.questions];
                          newQs[idx].options[optIdx] = e.target.value;
                          setAssignment({ ...assignment, questions: newQs });
                        }}
                        placeholder={`Option ${optIdx + 1}`}
                        className="w-full p-2 bg-white border rounded"
                      />
                    ))}
                    <select
                      value={q.correct}
                      onChange={(e) => {
                        const newQs = [...assignment.questions];
                        newQs[idx].correct = parseInt(e.target.value);
                        setAssignment({ ...assignment, questions: newQs });
                      }}
                      className="w-full p-2 bg-white border rounded"
                    >
                      {q.options.map((_, optIdx) => (
                        <option key={optIdx} value={optIdx}>
                          Correct Option {optIdx + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* Grading Rubric */}
            <textarea
              value={assignment.gradingRubric}
              onChange={(e) => setAssignment({ ...assignment, gradingRubric: e.target.value })}
              placeholder="Grading Rubric (optional)"
              className="w-full p-3 h-24 bg-white border rounded"
            ></textarea>

            {/* Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                onClick={handleSave}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded flex items-center justify-center gap-2"
              >
                <FaSave /> Save Changes
              </button>

              <button
                onClick={() => router.back()}
                className="w-full py-3 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded flex items-center justify-center gap-2"
              >
                <FaArrowLeft /> Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
