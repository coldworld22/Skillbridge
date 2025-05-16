import { useState } from "react";
import { FaArrowRight } from "react-icons/fa";

const goals = [
  "Improve coding skills",
  "Prepare for exams",
  "Learn a new language",
  "Boost academic performance",
  "Master AI tools",
  "Explore data science"
];

const models = [
  { key: "chatgpt", label: "ChatGPT 4" },
  { key: "deepseek", label: "DeepSeek AI" }
];

export default function LessonPlannerPage() {
  const [selectedGoal, setSelectedGoal] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!selectedGoal || !selectedModel) return;
    setLoading(true);
    setGeneratedPlan(null);

    // Simulate API call (replace with real backend integration)
    setTimeout(() => {
      setGeneratedPlan({
        goal: selectedGoal,
        model: selectedModel,
        plan: [
          "🧠 Week 1: Assessment & foundational concepts",
          "📘 Week 2–3: Targeted lessons with interactive content",
          "📝 Week 4: Practice quizzes + feedback",
          "🚀 Week 5+: Final project and certification prep"
        ]
      });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-20 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-yellow-400 mb-6">🎯 AI-Powered Lesson Planner</h1>
        <p className="text-lg text-gray-300 mb-8">
          Select your learning goal and preferred AI model to build a personalized plan.
        </p>

        {/* Goal Selector */}
        <div className="mb-6">
          <select
            value={selectedGoal}
            onChange={(e) => setSelectedGoal(e.target.value)}
            className="w-full max-w-md mx-auto bg-gray-800 text-white border border-gray-600 p-3 rounded-lg"
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
        <div className="flex justify-center gap-6 mb-6">
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

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!selectedGoal || !selectedModel || loading}
          className="mt-2 bg-yellow-500 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Generating..." : "Generate Plan"} <FaArrowRight className="inline ml-2" />
        </button>

        {/* Output Plan */}
        {generatedPlan && (
          <div className="mt-10 text-left bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">
              Plan for: {generatedPlan.goal} <span className="text-sm text-gray-400">({generatedPlan.model})</span>
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              {generatedPlan.plan.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}