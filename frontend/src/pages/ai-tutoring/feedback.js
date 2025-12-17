import { useState, useEffect } from "react";
import { askAI } from "@/services/aiService";
import { fetchThirdPartyConfig } from "@/services/thirdPartyService";
import { computeAvailableProviders } from "@/utils/aiProviders";
import styles from "./ai.module.scss";

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
    <div className={styles.page}>
      <div className={`${styles.container} ${styles.narrow}`}>
        <h1 className={styles.title}>📄 Instant Feedback</h1>
        <p className={styles.subtitle}>
          Paste or type your assignment below and receive instant AI-powered feedback.
        </p>

        {/* Model Selector */}
        <div className={styles.section} style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
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
        </div>
        {!models.length && (
          <p className={styles.callout}>
            AI feedback requires at least one configured provider. Ask an administrator to enable ChatGPT, DeepSeek, or Gemini in the Third Party settings.
          </p>
        )}

        <textarea
          rows={8}
          className={`${styles.textarea}`}
          style={{ marginTop: "1rem" }}
          placeholder="Paste your assignment text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        ></textarea>

        <button
          onClick={handleSubmit}
          disabled={loading || !text.trim() || !selectedModel}
          className={`${styles.btn} ${styles.btnPrimary}`}
        >
          {loading ? "Analyzing..." : "Get Feedback"}
        </button>

        {feedback && (
          <div className={`${styles.card} ${styles.cardMuted}`} style={{ marginTop: "1rem", whiteSpace: "pre-wrap" }}>
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
}
