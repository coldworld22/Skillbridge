import { useState } from "react";

const sampleQuestions = [
  {
    question: "What is the output of 2 + 2 * 2 in JavaScript?",
    options: ["6", "8", "4", "NaN"],
    answer: "6"
  },
  {
    question: "Which method is used to convert a JSON string into a JavaScript object?",
    options: ["JSON.stringify()", "JSON.parse()", "JSON.toObject()", "parse.JSON()"],
    answer: "JSON.parse()"
  },
  {
    question: "Which keyword is used to define a constant in JavaScript?",
    options: ["var", "let", "const", "define"],
    answer: "const"
  }
];

const models = [
  { key: "chatgpt", label: "ChatGPT 4" },
  { key: "deepseek", label: "DeepSeek AI" }
];

const fields = [
  "Computer Science",
  "Medicine",
  "Engineering",
  "Business",
  "Law",
  "Psychology",
  "Language Learning"
];

export default function PracticePage() {
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedField, setSelectedField] = useState("");
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);

  const startQuiz = () => {
    if (!selectedModel || !selectedField) return;
    setQuizStarted(true);
  };

  const handleSubmit = () => {
    if (selected === null) return;
    if (selected === sampleQuestions[current].answer) {
      setScore((s) => s + 1);
    }
    if (current < sampleQuestions.length - 1) {
      setCurrent((i) => i + 1);
      setSelected(null);
    } else {
      setShowResult(true);
    }
  };

  const resetQuiz = () => {
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setShowResult(false);
    setQuizStarted(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-yellow-400 mb-6 text-center">🧪 Practice Quiz</h1>

        {!quizStarted ? (
          <div className="text-center bg-gray-800 p-6 rounded-lg">
            <p className="text-gray-300 mb-4">Select your preferred AI model and field of study to begin:</p>

            <div className="flex justify-center gap-6 mb-4">
              {models.map((m) => (
                <label key={m.key} className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="radio"
                    name="model"
                    value={m.key}
                    checked={selectedModel === m.key}
                    onChange={() => setSelectedModel(m.key)}
                    className="accent-yellow-500"
                  />
                  {m.label}
                </label>
              ))}
            </div>

            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="w-full max-w-sm mx-auto bg-gray-800 text-white border border-gray-600 p-2 rounded mb-6"
            >
              <option value="" disabled>
                -- Select your study field --
              </option>
              {fields.map((field, i) => (
                <option key={i} value={field}>{field}</option>
              ))}
            </select>

            <button
              onClick={startQuiz}
              disabled={!selectedModel || !selectedField}
              className="bg-yellow-500 text-gray-900 px-6 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
            >
              Start Quiz
            </button>
          </div>
        ) : !showResult ? (
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Question {current + 1}</h2>
            <p className="mb-4 text-gray-300">{sampleQuestions[current].question}</p>
            <div className="space-y-3">
              {sampleQuestions[current].options.map((option, i) => (
                <label key={i} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="option"
                    value={option}
                    checked={selected === option}
                    onChange={() => setSelected(option)}
                    className="accent-yellow-500"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            <button
              onClick={handleSubmit}
              disabled={selected === null}
              className="mt-6 bg-yellow-500 text-gray-900 px-6 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
            >
              {current === sampleQuestions.length - 1 ? "Finish Quiz" : "Next Question"}
            </button>
          </div>
        ) : (
          <div className="bg-gray-800 p-6 rounded-lg shadow-md text-center">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">🎉 Quiz Complete</h2>
            <p className="text-lg text-gray-300 mb-2">Model used: <strong>{selectedModel}</strong></p>
            <p className="text-lg text-gray-300 mb-2">Study Field: <strong>{selectedField}</strong></p>
            <p className="text-lg text-gray-300 mb-6">You scored {score} out of {sampleQuestions.length}</p>
            <button
              onClick={resetQuiz}
              className="bg-yellow-500 text-gray-900 px-6 py-2 rounded hover:bg-yellow-600"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}