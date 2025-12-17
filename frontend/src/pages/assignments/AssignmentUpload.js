// src/pages/assignments/AssignmentUpload.js
import { useState } from 'react';

export default function AssignmentUpload({ onUpload }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [classId, setClassId] = useState('react-bootcamp');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !description || !dueDate) return;

    onUpload({ title, description, dueDate, classId, uploadedBy: 'instructor' });
    setTitle('');
    setDescription('');
    setDueDate('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-4 rounded shadow space-y-4 border border-gray-200"
    >
      <h2 className="text-lg font-semibold">Upload New Assignment</h2>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border px-3 py-2 rounded"
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border px-3 py-2 rounded"
      ></textarea>
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="w-full border px-3 py-2 rounded"
      />
      <button
        type="submit"
        className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
      >
        Upload Assignment
      </button>
    </form>
  );
}



