import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const CourseProgress = ({ course }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Load progress from localStorage
    const savedProgress = JSON.parse(localStorage.getItem(`progress-${course.id}`)) || 0;
    setProgress(savedProgress);
  }, [course.id]);

  const handleCompleteLesson = () => {
    if (progress < 100) {
      const newProgress = Math.min(progress + 10, 100); // Increment by 10% per lesson
      setProgress(newProgress);
      localStorage.setItem(`progress-${course.id}`, JSON.stringify(newProgress));
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-yellow-400 mb-2">{course.title}</h3>

      {/* Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
        <motion.div
          className="bg-yellow-400 h-3 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>

      <p className="text-sm text-gray-300">{progress}% Completed</p>

      <button
        onClick={handleCompleteLesson}
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Complete Lesson
      </button>
    </div>
  );
};

// Mock Data for Testing
const mockCourse = {
  id: 1,
  title: "Mastering React.js",
};

// Example Usage
const CourseProgressPage = () => (
  <div className="container mx-auto p-6">
    <h2 className="text-2xl font-bold text-yellow-400 mb-4">My Course Progress</h2>
    <CourseProgress course={mockCourse} />
  </div>
);

export default CourseProgressPage;
