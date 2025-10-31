import { useState, useEffect } from "react";
import { askAI } from "@/services/aiService";
import { fetchThirdPartyConfig } from "@/services/thirdPartyService";
import { computeAvailableProviders } from "@/utils/aiProviders";

export default function InstantFeedbackPage() {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const cfg = await fetchThirdPartyConfig();
        const { providers, defaultProvider } = computeAvailableProviders(cfg);
        setModels(providers);
        setSelectedModel(defaultProvider || "");
        if (!providers.length) {
          setFeedback(
            "AI feedback is unavailable. Please configure an AI provider in the admin settings."
          );
        }
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setFeedback(null);

    try {
      const { answer } = await askAI(selectedModel, text);
      setFeedback(answer);
    } catch (err) {
      setFeedback(err?.message || "Error fetching feedback");
    } finally {
      setLoading(false);
    }
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
        {!models.length && (
          <p className="text-sm text-yellow-300 mb-4">
            AI feedback requires at least one configured provider. Ask an administrator to enable ChatGPT, DeepSeek, or Gemini in the Third Party settings.
          </p>
        )}

        <textarea
          rows={8}
          className="w-full bg-gray-800 border border-gray-600 text-white p-4 rounded-lg mb-4"
          placeholder="Paste your assignment text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        ></textarea>

        <button
          onClick={handleSubmit}
          disabled={loading || !text.trim() || !selectedModel}
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
