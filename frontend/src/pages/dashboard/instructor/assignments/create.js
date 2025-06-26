// pages/dashboard/instructor/assignments/[classId]/create.js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import InstructorLayout from '@/components/layouts/InstructorLayout';
import { v4 as uuidv4 } from 'uuid';
import { fetchInstructorClasses, createClassAssignment } from '@/services/instructor/classService';

export default function CreateAssignmentPage() {
  const router = useRouter();
  const { classId: routerClassId } = router.query;

  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classId, setClassId] = useState('');
  const [type, setType] = useState('mcq');
  const [questions, setQuestions] = useState([{ id: uuidv4(), question: '', options: ['', '', '', ''], correct: 0, points: 1 }]);
  const [starterCode, setStarterCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [dueDate, setDueDate] = useState('');
  const [timeToFinish, setTimeToFinish] = useState('');
  const [allowLate, setAllowLate] = useState(false);
  const [resourceFile, setResourceFile] = useState(null);
  const [gradingRubric, setGradingRubric] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const [classes, setClasses] = useState([]);

  useEffect(() => {
    setMounted(true);
    if (routerClassId) setClassId(routerClassId);
    const load = async () => {
      try {
        const data = await fetchInstructorClasses();
        setClasses(data || []);
      } catch (err) {
        console.error('Failed to load classes', err);
      }
    };
    load();
  }, [routerClassId]);

  const handleAddQuestion = () => {
    setQuestions(prev => [...prev, { id: uuidv4(), question: '', options: ['', '', '', ''], correct: 0, points: 1 }]);
  };

  const handleQuestionChange = (id, field, value) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handleOptionChange = (id, idx, value) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, options: q.options.map((opt, i) => i === idx ? value : opt) } : q));
  };

  const handleSubmit = async () => {
    if (!title || !description || !classId || !dueDate) {
      alert('⚠️ Please fill all fields.');
      return;
    }

    const payload = {
      title,
      description,
      due_date: dueDate,
      time_to_finish: timeToFinish || null,
    };

    try {
      await createClassAssignment(classId, payload);
      router.push(`/dashboard/instructor/assignments/${classId}`);
    } catch (err) {
      console.error('Failed to create assignment', err);
      alert('Failed to create assignment');
    }
  };

  if (!mounted) return null;

  return (
    <InstructorLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <h1 className="text-2xl font-bold text-yellow-500 mb-8">🛠️ Create Assignment</h1>

        <div className="space-y-6">
          <input
            type="text"
            placeholder="Assignment Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 bg-gray-100 rounded-md"
          />

          <textarea
            placeholder="Assignment Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 h-32 bg-gray-100 rounded-md"
          />

          {/* Class Selection (autofilled if classId exists) */}
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            disabled={!!routerClassId}
            className="w-full p-3 bg-gray-100 rounded-md"
          >
            <option value="">Select Class</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-3 bg-gray-100 rounded-md"
          >
            <option value="mcq">MCQ (Multiple Choice)</option>
            <option value="text">Text Answer</option>
            <option value="code">Coding Challenge</option>
            <option value="file">File Upload</option>
          </select>

          {/* Assignment Details */}
          {type === 'mcq' && (
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="bg-gray-50 p-4 rounded-lg shadow">
                  <input
                    type="text"
                    placeholder={`Question ${idx + 1}`}
                    value={q.question}
                    onChange={(e) => handleQuestionChange(q.id, 'question', e.target.value)}
                    className="w-full p-2 mb-2 bg-gray-100 rounded"
                  />
                  {q.options.map((opt, i) => (
                    <input
                      key={i}
                      type="text"
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => handleOptionChange(q.id, i, e.target.value)}
                      className="w-full p-2 mb-2 bg-gray-100 rounded"
                    />
                  ))}
                  <select
                    value={q.correct}
                    onChange={(e) => handleQuestionChange(q.id, 'correct', parseInt(e.target.value))}
                    className="w-full p-2 bg-gray-100 rounded mb-2"
                  >
                    {q.options.map((_, idx) => (
                      <option key={idx} value={idx}>Correct Option {idx + 1}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Points"
                    value={q.points}
                    onChange={(e) => handleQuestionChange(q.id, 'points', parseInt(e.target.value))}
                    className="w-full p-2 bg-gray-100 rounded"
                  />
                </div>
              ))}
              <button onClick={handleAddQuestion} className="bg-yellow-500 px-4 py-2 rounded font-bold hover:bg-yellow-600">
                ➕ Add Another Question
              </button>
            </div>
          )}

          {type === 'code' && (
            <div className="space-y-4">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-3 bg-gray-100 rounded-md"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
              </select>
              <textarea
                placeholder="Starter Code (optional)"
                value={starterCode}
                onChange={(e) => setStarterCode(e.target.value)}
                className="w-full p-3 h-32 bg-gray-100 rounded-md"
              />
            </div>
          )}

          {/* File Upload or Text Answer */}
          {type === 'text' && (
            <textarea
              placeholder="Grading Rubric (optional)"
              value={gradingRubric}
              onChange={(e) => setGradingRubric(e.target.value)}
              className="w-full p-3 h-24 bg-gray-100 rounded-md"
            />
          )}

          {/* Late Submission Option */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allowLate}
              onChange={(e) => setAllowLate(e.target.checked)}
            />
            <label className="text-sm">Allow Late Submission</label>
          </div>

          {/* Estimated Time to Finish */}
          <input
            type="text"
            placeholder="Estimated time to finish (e.g. 2h, 3 days)"
            value={timeToFinish}
            onChange={(e) => setTimeToFinish(e.target.value)}
            className="w-full p-3 bg-gray-100 rounded-md"
          />

          {/* Due Date */}
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full p-3 bg-gray-100 rounded-md"
          />

          <div className="flex gap-4">
            <button
              onClick={() => setPreviewMode(true)}
              className="w-full py-3 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-full"
            >
              👁️ Preview
            </button>
            <button
              onClick={handleSubmit}
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full"
            >
              📤 Save Assignment
            </button>
          </div>
        </div>
      </div>
    </InstructorLayout>
  );
}
