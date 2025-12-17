import { useState, useEffect } from "react";
import { FaDownload, FaHistory } from "react-icons/fa";
import { askAI } from "@/services/aiService";
import { fetchThirdPartyConfig } from "@/services/thirdPartyService";
import { computeAvailableProviders } from "@/utils/aiProviders";
import styles from "./ai.module.scss";

const mockTranscript = {
  model: "ChatGPT 4",
  field: "Medicine",
  goals: "Prepare for board exams, review clinical cases, and improve academic writing.",
  history: [
    { type: "Quiz", date: "2025-05-01", detail: "Scored 4/5 in Anatomy basics" },
    { type: "Feedback", date: "2025-05-03", detail: "Essay on cardiovascular system reviewed" },
    { type: "Research", date: "2025-05-04", detail: "Summarized paper on medical ethics" },
    { type: "Chat", date: "2025-05-06", detail: "Asked about drug interactions" }
  ]
};

export default function AITranscriptPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const cfg = await fetchThirdPartyConfig();
        const { defaultProvider } = computeAvailableProviders(cfg);
        if (!defaultProvider) throw new Error('No provider');
        const { answer } = await askAI(
          defaultProvider,
          "Provide a sample learning transcript as JSON"
        );
        const parsed = JSON.parse(answer);
        setData(parsed);
      } catch (err) {
        setData(mockTranscript);
      }
    };
    load();
  }, []);

  const downloadTranscript = () => {
    const content = `AI Transcript\n\nModel: ${data.model}\nField: ${data.field}\nGoals: ${data.goals}\n\nActivity Log:\n` +
      data.history.map(item => `- [${item.date}] ${item.type}: ${item.detail}`).join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "AI_Transcript.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.page}>
      <div className={`${styles.container} ${styles.narrow}`}>
        <h1 className={styles.title}>📘 AI Learning Transcript</h1>
        <p className={styles.subtitle}>A personal log of your AI-assisted educational journey—tailored to your goals and interactions.</p>

        {!data ? (
          <p className={styles.muted}>Loading transcript...</p>
        ) : (
          <div className={`${styles.card} ${styles.cardMuted}`}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>🎯 Your Setup</h2>
              <p className={styles.text}><strong>Model:</strong> {data.model}</p>
              <p className={styles.text}><strong>Field:</strong> {data.field}</p>
              <p className={styles.text}><strong>Goals:</strong> {data.goals}</p>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>📑 Activity Log</h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {data.history.map((entry, i) => (
                  <li key={i} className={styles.message} style={{ display: "flex", gap: "0.6rem" }}>
                    <FaHistory color="#fbbf24" style={{ marginTop: "0.15rem" }} />
                    <div>
                      <p className={styles.text} style={{ margin: 0 }}>
                        [{entry.date}] <strong>{entry.type}</strong>: {entry.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={downloadTranscript}
              className={`${styles.btn} ${styles.btnPrimary}`}
              style={{ marginTop: "1rem" }}
            >
              <FaDownload /> Download Transcript
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
