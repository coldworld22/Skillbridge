import React, { useState } from "react";

const QuizModal = ({ isOpen, closeQuiz, questions, onPass }) => {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleAnswer = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const checkAnswers = () => {
    const correctAnswers = questions.every(q => answers[q.id] === q.correct);
    setSubmitted(true);
    if (correctAnswers) onPass(); // Unlock next lesson if correct
  };

  return isOpen ? (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg w-1/2">
        <h2 className="text-yellow-400 text-xl font-bold mb-4">Quiz</h2>
        {questions.map(q => (
          <div key={q.id} className="mb-4">
            <p>{q.question}</p>
            {q.options.map(option => (
              <button
                key={option}
                onClick={() => handleAnswer(q.id, option)}
                className={`mt-2 px-4 py-2 rounded-lg ${answers[q.id] === option ? "bg-yellow-500" : "bg-gray-700"} hover:bg-yellow-600 transition`}
              >
                {option}
              </button>
            ))}
          </div>
        ))}
        <button onClick={checkAnswers} className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
          Submit Quiz
        </button>
        {submitted && <p className="text-white mt-2">{answers.correct ? "✅ Passed!" : "❌ Try Again!"}</p>}
        <button onClick={closeQuiz} className="mt-2 text-red-400">Close</button>
      </div>
    </div>
  ) : null;
};

export default QuizModal;
