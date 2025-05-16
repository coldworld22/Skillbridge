import { useState } from "react";

const models = [
  { key: "chatgpt", label: "ChatGPT 4" },
  { key: "deepseek", label: "DeepSeek AI" }
];

const modes = [
  { key: "summary", label: "Summarize" },
  { key: "explain", label: "Explain" }
];

export default function ResearchAssistantPage() {
  const [selectedModel, setSelectedModel] = useState("chatgpt");
  const [selectedMode, setSelectedMode] = useState("summary");
  const [inputText, setInputText] = useState("");
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [followUp, setFollowUp] = useState("");
  const [followUpResponse, setFollowUpResponse] = useState(null);

  const handleAnalyze = () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setOutput(null);

    setTimeout(() => {
      setOutput(
        selectedMode === "summary"
          ? `📚 [${selectedModel.toUpperCase()}] Summary:\n\nThis paper presents an overview of key findings, emphasizes important correlations, and outlines suggestions for future research.`
          : `🧠 [${selectedModel.toUpperCase()}] Explanation:\n\nThis section discusses complex methodologies. The use of regression analysis implies a predictive modeling approach, focusing on variable X's impact on Y.`
      );
      setLoading(false);
    }, 1500);
  };

  const handleFollowUp = () => {
    if (!followUp.trim()) return;
    setFollowUpResponse(`💬 [${selectedModel.toUpperCase()}] Follow-up response:\n\nHere's what you need to know about: "${followUp}". It's a crucial element in context of the provided content.`);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setInputText(`[Extracted mock text from uploaded file: ${file.name}]\nLorem ipsum dolor sit amet, consectetur adipiscing elit...`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-yellow-400 mb-4">🧠 Research Assistant</h1>
        <p className="text-gray-300 mb-6">
          Paste or upload your research content and let the AI summarize or explain it.
        </p>

        {/* Model & Mode Selectors */}
        <div className="flex flex-wrap gap-6 mb-4">
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
          {modes.map((m) => (
            <label key={m.key} className="flex items-center gap-2 text-sm text-blue-300">
              <input
                type="radio"
                name="mode"
                value={m.key}
                checked={selectedMode === m.key}
                onChange={() => setSelectedMode(m.key)}
                className="accent-blue-500"
              />
              {m.label}
            </label>
          ))}
        </div>

        {/* File Upload */}
        <div className="mb-4">
          <input
            type="file"
            accept=".txt,.pdf,.doc,.docx"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-300 bg-gray-800 border border-gray-600 rounded-lg p-2"
          />
        </div>

        <textarea
          rows={10}
          className="w-full bg-gray-800 border border-gray-600 text-white p-4 rounded-lg mb-4"
          placeholder="Paste your research paper or abstract here..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        ></textarea>

        <button
          onClick={handleAnalyze}
          disabled={loading || !inputText.trim()}
          className="bg-yellow-500 text-gray-900 px-6 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
        >
          {loading ? `${selectedMode === "summary" ? "Summarizing" : "Explaining"}...` : `Get ${selectedMode === "summary" ? "Summary" : "Explanation"}`}
        </button>

        {output && (
          <div className="mt-6 bg-gray-800 p-4 rounded-lg text-gray-300 whitespace-pre-wrap">
            {output}
          </div>
        )}

        {output && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-yellow-400 mb-2">💬 Ask a Follow-Up Question</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                placeholder="e.g., What does variable X represent?"
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none"
              />
              <button
                onClick={handleFollowUp}
                className="bg-yellow-500 text-gray-900 px-4 py-2 rounded hover:bg-yellow-600"
              >
                Ask
              </button>
            </div>
            {followUpResponse && (
              <div className="bg-gray-800 p-4 rounded-lg text-gray-300 whitespace-pre-wrap">
                {followUpResponse}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
