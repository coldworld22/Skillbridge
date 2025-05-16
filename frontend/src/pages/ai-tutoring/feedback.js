import { useState } from "react";

const models = [
  { key: "chatgpt", label: "ChatGPT 4" },
  { key: "deepseek", label: "DeepSeek AI" }
];

export default function InstantFeedbackPage() {
  const [selectedModel, setSelectedModel] = useState("chatgpt");
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!text.trim()) return;
    setLoading(true);
    setFeedback(null);

    setTimeout(() => {
      setFeedback(
        `🤖 [${selectedModel.toUpperCase()}] Feedback:

Great structure! Make sure to elaborate more on paragraph 2.
Keep your tone consistent and cite sources properly.`
      );
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-yellow-400 mb-4">📄 Instant Feedback</h1>
        <p className="text-gray-300 mb-6">
          Paste or type your assignment below and receive instant AI-powered feedback.
        </p>

        {/* Model Selector */}
        <div className="flex gap-6 mb-4">
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

        <textarea
          rows={8}
          className="w-full bg-gray-800 border border-gray-600 text-white p-4 rounded-lg mb-4"
          placeholder="Paste your assignment text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        ></textarea>

        <button
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          className="bg-yellow-500 text-gray-900 px-6 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Get Feedback"}
        </button>

        {feedback && (
          <div className="mt-6 bg-gray-800 p-4 rounded-lg text-gray-300 whitespace-pre-wrap">
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
}