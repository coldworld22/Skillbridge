import { useState } from "react";
import { motion } from "framer-motion";

export default function AILessonPlanner() {
  const [learningGoal, setLearningGoal] = useState("");
  const [skillLevel, setSkillLevel] = useState("beginner");
  const [studyDuration, setStudyDuration] = useState("daily");
  const [generatedPlan, setGeneratedPlan] = useState(null);

  const handleGeneratePlan = async () => {
    // Placeholder for backend API call
    const response = await fetch("/api/generate-study-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ learningGoal, skillLevel, studyDuration }),
    });
    const data = await response.json();
    setGeneratedPlan(data);
  };

  return (
    <div className="p-10 text-center bg-gray-900 text-white min-h-screen">
      <h1 className="text-4xl font-bold">📖 AI Lesson Planner</h1>
      <p className="mt-4 text-lg text-gray-300">Generate a personalized study plan based on your progress.</p>
      
      {/* User Input Form */}
      <div className="mt-6 bg-gray-800 p-6 rounded-lg shadow-lg text-left max-w-lg mx-auto">
        <label className="block text-gray-300 text-sm font-bold mb-2">Learning Goal:</label>
        <input
          type="text"
          value={learningGoal}
          onChange={(e) => setLearningGoal(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-white"
          placeholder="E.g., Master React.js"
        />

        <label className="block text-gray-300 text-sm font-bold mt-4">Skill Level:</label>
        <select
          value={skillLevel}
          onChange={(e) => setSkillLevel(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-white"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>

        <label className="block text-gray-300 text-sm font-bold mt-4">Study Duration:</label>
        <select
          value={studyDuration}
          onChange={(e) => setStudyDuration(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-white"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>

        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={handleGeneratePlan}
          className="mt-6 px-6 py-3 bg-yellow-500 text-gray-900 font-semibold text-lg rounded-lg shadow-lg hover:bg-yellow-600 transition w-full"
        >
          Generate Study Plan
        </motion.button>
      </div>
      
      {/* Display Generated Plan */}
      {generatedPlan && (
        <div className="mt-10 p-6 bg-gray-800 rounded-lg shadow-lg text-left max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-yellow-400">Your Study Plan</h2>
          <p className="text-gray-300 mt-2">{generatedPlan.plan}</p>
        </div>
      )}
    </div>
  );
}