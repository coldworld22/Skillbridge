// components/tutorials/ProgressChecklistModal.js
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";

export default function ProgressChecklistModal({ isOpen, onClose, tutorial }) {
  if (!isOpen || !tutorial) return null;

  const checklist = [
    { label: "Title & Description", valid: tutorial.title && tutorial.description },
    { label: "Thumbnail", valid: !!tutorial.thumbnail },
    { label: "At least 1 Lesson", valid: tutorial.lessons?.length > 0 },
    { label: "Category", valid: !!tutorial.category_id },
    { label: "Tags", valid: tutorial.tags?.length > 0 },
    { label: "Language & Level", valid: tutorial.language && tutorial.level },
    { label: "Price or Free", valid: tutorial.price !== undefined },
    { label: "Quiz/Test", valid: tutorial.has_quiz || tutorial.quiz_questions?.length > 0 },
    { label: "Submitted/Approved", valid: ["Submitted", "Approved"].includes(tutorial.status) },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-xl w-full max-w-md p-6 shadow-lg relative"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-4 text-gray-500 hover:text-black"
          >
            <FaTimes />
          </button>

          <h2 className="text-xl font-bold mb-4 text-gray-800">🧩 Tutorial Progress Checklist</h2>
          <ul className="space-y-2">
            {checklist.map((item, idx) => (
              <li
                key={idx}
                className={`flex items-center justify-between px-4 py-2 rounded ${
                  item.valid ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"
                }`}
              >
                <span>{item.label}</span>
                <span>{item.valid ? "✅" : "❌"}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
