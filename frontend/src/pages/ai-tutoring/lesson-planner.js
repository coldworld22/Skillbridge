import { useState, useEffect } from "react";
import { FaArrowRight } from "react-icons/fa";
import { askAI } from "@/services/aiService";
import { fetchThirdPartyConfig } from "@/services/thirdPartyService";
import { computeAvailableProviders } from "@/utils/aiProviders";
import styles from "./ai.module.scss";

const goals = [
  "Improve coding skills",
  "Prepare for exams",
  "Learn a new language",
  "Boost academic performance",
  "Master AI tools",
  "Explore data science"
];

export default function LessonPlannerPage() {
  const [selectedGoal, setSelectedGoal] = useState("");
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const handleGenerate = async () => {
    if (!selectedGoal || !selectedModel) return;
    setLoading(true);
    setGeneratedPlan(null);

    try {
      const { answer } = await askAI(
        selectedModel,
        `Create a lesson plan for: ${selectedGoal}`
      );
      setGeneratedPlan({
        goal: selectedGoal,
        model: selectedModel,
        plan: answer.split("\n").filter(Boolean),
      });
    } catch (err) {
      setGeneratedPlan({
        goal: selectedGoal,
        model: selectedModel,
        plan: [err?.message || "Error generating plan"],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={`${styles.container} ${styles.narrow}`} style={{ textAlign: "center" }}>
        <h1 className={styles.title}>🎯 AI-Powered Lesson Planner</h1>
        <p className={styles.subtitle}>
          Select your learning goal and preferred AI model to build a personalized plan.
        </p>

        {/* Goal Selector */}
        <div className={styles.section}>
          <select
            value={selectedGoal}
            onChange={(e) => setSelectedGoal(e.target.value)}
            className={styles.select}
            style={{ maxWidth: "24rem", margin: "0 auto" }}
          >
            <option value="" disabled>
              -- Choose your goal --
            </option>
            {goals.map((goal, idx) => (
              <option key={idx} value={goal}>
                {goal}
              </option>
            ))}
          </select>
        </div>

        {/* Model Selector */}
        <div className={styles.section} style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
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
          <p className={`${styles.callout}`} style={{ marginTop: "0.25rem" }}>
            Activate at least one AI provider in the admin settings to generate lesson plans.
          </p>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!selectedGoal || !selectedModel || loading}
          className={`${styles.btn} ${styles.btnPrimary}`}
          style={{ marginTop: "0.75rem" }}
        >
          {loading ? "Generating..." : "Generate Plan"} <FaArrowRight className="inline ml-2" />
        </button>

        {/* Output Plan */}
        {generatedPlan && (
          <div className={styles.card} style={{ marginTop: "1.5rem", textAlign: "left" }}>
            <h2 className={styles.sectionTitle}>
              Plan for: {generatedPlan.goal} <span className={styles.muted}>({generatedPlan.model})</span>
            </h2>
            <ul className={styles.list}>
              {generatedPlan.plan.map((step, i) => (
                <li key={i} className={styles.listItem}>{step}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
