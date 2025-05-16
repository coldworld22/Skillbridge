// pages/dashboard/student/assignments/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import StudentLayout from '@/components/layouts/StudentLayout';
import { FaExclamationTriangle, FaPlay, FaUpload } from 'react-icons/fa';

export default function AssignmentSolvePage() {
  const router = useRouter();
  const { id } = router.query;
  const [assignment, setAssignment] = useState(null);
  const [started, setStarted] = useState(false);
  const [blurCount, setBlurCount] = useState(0);
  const [file, setFile] = useState(null);
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    if (id) {
      setAssignment({
        id,
        title: 'React Hooks Deep Dive',
        description: 'Complete the following tasks using React Hooks...',
        dueDate: '2025-05-30T23:59:00Z',
        classTitle: 'React & Next.js Bootcamp',
      });
    }
  }, [id]);

  useEffect(() => {
    if (started) {
      window.addEventListener('blur', handleBlur);
      enterFullscreen();
    }
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, [started]);

  const handleBlur = () => {
    setBlurCount(prev => prev + 1);
    if (blurCount < 2) {
      alert('⚠️ Warning: Please stay focused! Switching tabs or minimizing is not allowed.');
    } else if (blurCount === 2) {
      alert('⚠️ Final Warning: One more distraction and the assignment will be flagged!');
    } else {
      alert('🚫 You have exceeded the allowed distractions. Admins will be notified.');
    }
  };

  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen();
  };

  const handleStart = () => {
    setStarted(true);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = () => {
    if (!answer && !file) {
      alert('⚠️ Please either type your answer or upload a file before submitting.');
      return;
    }
    alert('✅ Assignment submitted successfully!');
    router.push('/dashboard/student/assignments');
  };

  if (!assignment) return <div className="text-center mt-32 text-white">Loading...</div>;

  return (
    <StudentLayout>
      <div className="min-h-screen bg-white px-6 py-10 text-gray-900">
        <h1 className="text-2xl font-bold text-yellow-500 mb-6">📝 Solve Assignment</h1>

        <div className="bg-gray-100 p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-2">{assignment.title}</h2>
          <p className="text-sm text-gray-600 mb-2">Class: {assignment.classTitle}</p>
          <p className="text-sm text-gray-600 mb-4">Due: {new Date(assignment.dueDate).toLocaleString()}</p>

          {!started ? (
            <>
              <div className="bg-yellow-100 border border-yellow-400 p-4 rounded mb-6">
                <h3 className="flex items-center gap-2 font-bold text-yellow-800 mb-2">
                  <FaExclamationTriangle /> Assignment Rules
                </h3>
                <ul className="list-disc list-inside text-sm text-yellow-700">
                  <li>No tab switching or minimizing the window.</li>
                  <li>Fullscreen mode is required during the assignment.</li>
                  <li>No external help (search engines, friends, etc.).</li>
                  <li>Submit your own honest work.</li>
                </ul>
              </div>

              <button
                onClick={handleStart}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 py-3 rounded-full w-full flex items-center justify-center gap-2"
              >
                <FaPlay /> Start Assignment
              </button>
            </>
          ) : (
            <div className="space-y-6">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your assignment answer here..."
                className="w-full h-48 p-4 bg-gray-200 rounded-md text-gray-800 focus:outline-none"
              ></textarea>

              <div>
                <label className="block mb-2 text-sm font-medium">Or Upload File (PDF, DOCX):</label>
                <input
                  type="file"
                  accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-700 bg-gray-200 rounded p-2"
                />
              </div>

              <button
                onClick={handleSubmit}
                className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-full flex items-center justify-center gap-2"
              >
                <FaUpload /> Submit Assignment
              </button>
            </div>
          )}
        </div>

        {started && (
          <p className="mt-6 text-center text-sm text-red-500">
            Blur warnings: {blurCount}
          </p>
        )}
      </div>
    </StudentLayout>
  );
}