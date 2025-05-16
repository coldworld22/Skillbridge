import React, { useState } from 'react';

export default function MarkCompleteButton({ onComplete }) {
  const [completed, setCompleted] = useState(false);

  const handleComplete = () => {
    setCompleted(true);
    if (onComplete) onComplete(); // callback for parent
  };

  return (
    <button
      onClick={handleComplete}
      disabled={completed}
      className={`px-6 py-2 rounded-md font-semibold transition ${
        completed ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-400'
      }`}
    >
      {completed ? '✅ Completed' : 'Mark as Complete'}
    </button>
  );
}
