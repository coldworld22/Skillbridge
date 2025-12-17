import { useState, useEffect } from "react";
import { fetchThirdPartyConfig } from "@/services/thirdPartyService";
import { computeAvailableProviders } from "@/utils/aiProviders";
import styles from "./ai.module.scss";

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
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedField, setSelectedField] = useState("");
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);

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
    <div className={styles.page}>
      <div className={`${styles.container} ${styles.narrow}`}>
        <h1 className={styles.title}>🧪 Practice Quiz</h1>

        {!quizStarted ? (
          <div className={`${styles.card} ${styles.cardMuted}`} style={{ textAlign: "center" }}>
            <p className={styles.muted}>Select your preferred AI model and field of study to begin:</p>

            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
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
                Enable an AI provider to unlock adaptive practice quizzes.
              </p>
            )}

            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className={styles.select}
              style={{ maxWidth: "22rem", margin: "1rem auto" }}
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
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              Start Quiz
            </button>
          </div>
        ) : !showResult ? (
          <div className={styles.quizCard}>
            <h2 className={styles.sectionTitle}>Question {current + 1}</h2>
            <p className={styles.text} style={{ color: "#e5e7eb" }}>{sampleQuestions[current].question}</p>
            <div className={styles.section} style={{ marginTop: "0.5rem" }}>
              {sampleQuestions[current].options.map((option, i) => (
                <label key={i} className={styles.quizOption}>
                  <input
                    type="radio"
                    name="option"
                    value={option}
                    checked={selected === option}
                    onChange={() => setSelected(option)}
                    className={styles.radioInput}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            <button
              onClick={handleSubmit}
              disabled={selected === null}
              className={`${styles.btn} ${styles.btnPrimary}`}
              style={{ marginTop: "0.75rem" }}
            >
              {current === sampleQuestions.length - 1 ? "Finish Quiz" : "Next Question"}
            </button>
          </div>
        ) : (
          <div className={`${styles.card} ${styles.cardMuted}`} style={{ textAlign: "center" }}>
            <h2 className={styles.sectionTitle}>🎉 Quiz Complete</h2>
            <p className={styles.text}>Model used: <strong>{selectedModel}</strong></p>
            <p className={styles.text}>Study Field: <strong>{selectedField}</strong></p>
            <p className={styles.text}>You scored {score} out of {sampleQuestions.length}</p>
            <button
              onClick={resetQuiz}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
