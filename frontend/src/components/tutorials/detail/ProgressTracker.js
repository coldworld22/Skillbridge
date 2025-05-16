import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Circle } from "lucide-react";

const ProgressTracker = () => {
  const [completed, setCompleted] = useState(false);

  return (
    <motion.div
      className="bg-gray-800 p-6 rounded-lg shadow mb-10 flex items-center justify-between"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3">
        {completed ? (
          <CheckCircle className="w-6 h-6 text-green-400" />
        ) : (
          <Circle className="w-6 h-6 text-yellow-500" />
        )}
        <span className="text-white font-medium text-lg">
          {completed ? "You've completed this tutorial!" : "Mark as complete"}
        </span>
      </div>

      <button
        onClick={() => setCompleted(!completed)}
        className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
          completed
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-yellow-500 hover:bg-yellow-600 text-black"
        }`}
      >
        {completed ? "Completed" : "Mark Complete"}
      </button>
    </motion.div>
  );
};

export default ProgressTracker;
