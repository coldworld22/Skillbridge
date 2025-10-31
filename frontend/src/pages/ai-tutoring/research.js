import { useState, useEffect } from "react";
import { askAI } from "@/services/aiService";
import { fetchThirdPartyConfig } from "@/services/thirdPartyService";
import { computeAvailableProviders } from "@/utils/aiProviders";

const modes = [
  { key: "summary", label: "Summarize" },
  { key: "explain", label: "Explain" }
];
export default function ResearchAssistantPage() {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedMode, setSelectedMode] = useState("summary");
  const [inputText, setInputText] = useState("");
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [followUp, setFollowUp] = useState("");
  const [followUpResponse, setFollowUpResponse] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const cfg = await fetchThirdPartyConfig();
        const { providers, defaultProvider } = computeAvailableProviders(cfg);
        setModels(providers);
        setSelectedModel(defaultProvider || "");
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setOutput(null);

    try {
      const { answer } = await askAI(
        selectedModel,
        `${selectedMode}: ${inputText}`
      );
      setOutput(answer);
    } catch (err) {
      setOutput(err?.message || "Error generating response");
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUp = async () => {
    if (!followUp.trim()) return;
    try {
      const { answer } = await askAI(selectedModel, followUp);
      setFollowUpResponse(answer);
    } catch (err) {
      setFollowUpResponse(err?.message || "Error fetching response");
    }
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
        {!models.length && (
          <p className="text-sm text-yellow-300 mb-4">
            AI research assistance requires an active provider. Configure ChatGPT, DeepSeek, or Gemini in the Third Party settings.
          </p>
        )}

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
          disabled={loading || !inputText.trim() || !selectedModel}
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
                disabled={!selectedModel}
                className="bg-yellow-500 text-gray-900 px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
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
