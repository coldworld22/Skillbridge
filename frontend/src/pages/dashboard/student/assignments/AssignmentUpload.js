// pages/assignments/AssignmentUpload.js
import { useRouter } from 'next/router';
import { useState } from 'react';
import StudentLayout from '@/components/layouts/StudentLayout';

export default function AssignmentUpload() {
  const router = useRouter();
  const { id } = router.query;
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Assignment submitted successfully! (mocked)');
    router.push('/assignments');
  };

  return (
    <StudentLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <h1 className="text-2xl font-bold text-yellow-500 mb-6">
          📤 Upload Assignment {id && `for ID: ${id}`}
        </h1>

        <form onSubmit={handleSubmit} className="bg-gray-100 p-6 rounded-xl shadow-md max-w-xl mx-auto">
          <label className="block mb-4">
            <span className="text-gray-700 font-semibold">Upload File</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.zip,.rar"
              onChange={handleFileChange}
              required
              className="mt-2 block w-full p-2 border border-gray-300 rounded"
            />
          </label>

          <button
            type="submit"
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-6 rounded-full w-full"
          >
            Submit Assignment
          </button>
        </form>
      </div>
    </StudentLayout>
  );
}
