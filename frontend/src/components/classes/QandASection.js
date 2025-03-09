import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaQuestionCircle, FaReply } from "react-icons/fa";

const QandASection = () => {
  const [questions, setQuestions] = useState([
    {
      id: 1,
      question: "Is there a certificate after completing this course?",
      answers: ["Yes, you will receive a certificate upon completion."],
      showAnswers: false,
    },
    {
      id: 2,
      question: "What prior knowledge is required?",
      answers: ["Basic JavaScript knowledge is recommended, but not required."],
      showAnswers: false,
    },
  ]);

  const [newQuestion, setNewQuestion] = useState("");

  // Handle asking a new question
  const handleAskQuestion = () => {
    if (newQuestion.trim() === "") return;
    setQuestions([
      { id: questions.length + 1, question: newQuestion, answers: [], showAnswers: false },
      ...questions,
    ]);
    setNewQuestion(""); // Clear input field
  };

  // Toggle answers visibility
  const toggleAnswers = (id) => {
    setQuestions(questions.map(q =>
      q.id === id ? { ...q, showAnswers: !q.showAnswers } : q
    ));
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg mt-10">
      <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
        <FaQuestionCircle /> Q&A Section
      </h2>

      {/* Ask a Question Form */}
      <div className="mt-4">
        <input
          type="text"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="Ask a question..."
          className="w-full p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
        <button
          onClick={handleAskQuestion}
          className="mt-2 bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
        >
          Ask Question
        </button>
      </div>

      {/* Display Questions */}
      <div className="mt-6">
        {questions.map((q) => (
          <motion.div
            key={q.id}
            className="bg-gray-700 p-4 rounded-lg mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleAnswers(q.id)}>
              <p className="text-white font-semibold">{q.question}</p>
              <span className="text-yellow-400">{q.showAnswers ? "▲" : "▼"}</span>
            </div>
            
            {/* Show Answers */}
            {q.showAnswers && (
              <motion.div
                className="mt-2 text-gray-300 pl-4 border-l-2 border-yellow-400"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {q.answers.length > 0 ? (
                  q.answers.map((answer, index) => (
                    <p key={index} className="flex items-center gap-2">
                      <FaReply className="text-green-400" /> {answer}
                    </p>
                  ))
                ) : (
                  <p className="text-gray-400 italic">No answers yet</p>
                )}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default QandASection;
