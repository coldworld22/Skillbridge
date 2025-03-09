import { useState, useEffect } from "react";

const QASection = ({ liveClassId }) => {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");

  // Dummy Questions (Replace with API Call)
  useEffect(() => {
    setQuestions([
      { id: 1, name: "Alice", question: "How do hooks work in React?" },
      { id: 2, name: "Bob", question: "What is the difference between useState and useEffect?" },
    ]);
  }, [liveClassId]);

  // Handle Adding a New Question
  const handleAskQuestion = () => {
    if (newQuestion.trim() === "") return;
    const questionData = {
      id: questions.length + 1,
      name: "You", // Replace with real user data
      question: newQuestion,
    };
    setQuestions([...questions, questionData]);
    setNewQuestion("");
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg mt-6">
      <h3 className="text-lg font-semibold text-yellow-400">💬 Q&A Section</h3>
      <div className="mt-3">
        {questions.length === 0 ? (
          <p className="text-gray-300">No questions asked yet.</p>
        ) : (
          <ul className="space-y-2">
            {questions.map((q) => (
              <li key={q.id} className="bg-gray-700 p-2 rounded-lg">
                <strong className="text-yellow-400">{q.name}:</strong> <span className="text-white">{q.question}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Question Input Field */}
      <div className="mt-4 flex">
        <input
          type="text"
          className="flex-1 bg-gray-600 text-white p-2 rounded-lg focus:outline-none"
          placeholder="Ask a question..."
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
        />
        <button
          onClick={handleAskQuestion}
          className="ml-3 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
        >
          Ask
        </button>
      </div>
    </div>
  );
};

export default QASection;
