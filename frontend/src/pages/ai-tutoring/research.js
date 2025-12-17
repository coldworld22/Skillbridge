import { useState, useEffect } from "react";
import { askAI } from "@/services/aiService";
import { fetchThirdPartyConfig } from "@/services/thirdPartyService";
import { computeAvailableProviders } from "@/utils/aiProviders";
import styles from "./ai.module.scss";

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
    <div className={styles.page}>
      <div className={`${styles.container} ${styles.narrow}`}>
        <h1 className={styles.title}>🧠 Research Assistant</h1>
        <p className={styles.subtitle}>
          Paste or upload your research content and let the AI summarize or explain it.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", margin: "1rem 0" }}>
          {models.map((m) => (
            <label key={m.key} className={styles.radioRow}>
              <input
                type="radio"
                name="model"
                value={m.key}
                checked={selectedModel === m.key}
                onChange={() => setSelectedModel(m.key)}
                className={styles.radioInput}
              />
              {m.label}
            </label>
          ))}
          {modes.map((m) => (
            <label key={m.key} className={styles.radioRow}>
              <input
                type="radio"
                name="mode"
                value={m.key}
                checked={selectedMode === m.key}
                onChange={() => setSelectedMode(m.key)}
                className={styles.radioInput}
              />
              {m.label}
            </label>
          ))}
        </div>
        {!models.length && (
          <p className={styles.callout}>
            AI research assistance requires an active provider. Configure ChatGPT, DeepSeek, or Gemini in the Third Party settings.
          </p>
        )}

        <div className={styles.section}>
          <input
            type="file"
            accept=".txt,.pdf,.doc,.docx"
            onChange={handleFileUpload}
            className={styles.input}
          />
        </div>

        <textarea
          rows={10}
          className={styles.textarea}
          placeholder="Paste your research paper or abstract here..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          style={{ marginTop: "1rem" }}
        ></textarea>

        <button
          onClick={handleAnalyze}
          disabled={loading || !inputText.trim() || !selectedModel}
          className={`${styles.btn} ${styles.btnPrimary}`}
          style={{ marginTop: "0.75rem" }}
        >
          {loading ? `${selectedMode === "summary" ? "Summarizing" : "Explaining"}...` : `Get ${selectedMode === "summary" ? "Summary" : "Explanation"}`}
        </button>

        {output && (
          <div className={`${styles.card} ${styles.cardMuted}`} style={{ marginTop: "1rem", whiteSpace: "pre-wrap" }}>
            {output}
          </div>
        )}

        {output && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>💬 Ask a Follow-Up Question</h2>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <input
                type="text"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                placeholder="e.g., What does variable X represent?"
                className={styles.input}
              />
              <button
                onClick={handleFollowUp}
                disabled={!selectedModel}
                className={`${styles.btn} ${styles.btnPrimary}`}
              >
                Ask
              </button>
            </div>
            {followUpResponse && (
              <div className={`${styles.card} ${styles.cardMuted}`} style={{ marginTop: "0.75rem", whiteSpace: "pre-wrap" }}>
                {followUpResponse}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
