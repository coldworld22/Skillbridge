import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaThumbsUp, FaCheckCircle } from "react-icons/fa";

// Mock Q&A Data
const mockQuestions = [
  { id: 1, user: "John Doe", question: "How do I use useState in React?", upvotes: 5, bestAnswer: false, answers: [] },
  { id: 2, user: "Jane Smith", question: "What is the best way to manage state?", upvotes: 3, bestAnswer: false, answers: [] },
];

const LiveDiscussion = () => {
  const [questions, setQuestions] = useState(mockQuestions);
  const [newQuestion, setNewQuestion] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    // Sorting Logic
    if (sortBy === "most-upvoted") {
      setQuestions([...questions].sort((a, b) => b.upvotes - a.upvotes));
    } else {
      setQuestions([...questions].sort((a, b) => b.id - a.id)); // Sort by recent
    }
  }, [sortBy]);

  // Handle New Question
  const handleAskQuestion = () => {
    if (newQuestion.trim()) {
      setQuestions([{ id: questions.length + 1, user: "You", question: newQuestion, upvotes: 0, bestAnswer: false, answers: [] }, ...questions]);
      setNewQuestion("");
    }
  };

  // Handle Upvotes
  const handleUpvote = (id) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, upvotes: q.upvotes + 1 } : q));
  };

  // Handle Mark Best Answer
  const markBestAnswer = (id) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, bestAnswer: true } : q));
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-yellow-400 mb-4">Live Q&A Discussion</h2>

      {/* Ask Question Input */}
      <div className="flex mb-4">
        <input
          type="text"
          placeholder="Ask a question..."
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none"
        />
        <button
          onClick={handleAskQuestion}
          className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Ask
        </button>
      </div>

      {/* Sorting Dropdown */}
      <div className="mb-4">
        <select
          className="bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:outline-none"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="recent">🆕 Most Recent</option>
          <option value="most-upvoted">👍 Most Upvoted</option>
        </select>
      </div>

      {/* Questions List */}
      {questions.length > 0 ? (
        <div className="space-y-4">
          {questions.map((q) => (
            <motion.div
              key={q.id}
              className="p-4 bg-gray-700 rounded-lg shadow-md"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-white font-semibold">{q.user}</p>
              <p className="text-gray-300">{q.question}</p>

              {/* Actions */}
              <div className="flex justify-between items-center mt-3">
                <button
                  onClick={() => handleUpvote(q.id)}
                  className="flex items-center text-gray-400 hover:text-yellow-400 transition"
                >
                  <FaThumbsUp className="mr-2" /> {q.upvotes} Upvotes
                </button>

                {q.bestAnswer ? (
                  <span className="text-green-400 flex items-center">
                    <FaCheckCircle className="mr-2" /> Best Answer
                  </span>
                ) : (
                  <button
                    onClick={() => markBestAnswer(q.id)}
                    className="text-gray-400 hover:text-green-400 transition"
                  >
                    Mark as Best
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400">No questions yet. Be the first to ask!</p>
      )}
    </div>
  );
};

// Example Usage
const CourseDiscussionPage = () => (
  <div className="container mx-auto p-6">
    <LiveDiscussion />
  </div>
);

export default CourseDiscussionPage;
