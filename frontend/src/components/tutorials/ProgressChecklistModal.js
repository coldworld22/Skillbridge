// components/tutorials/ProgressChecklistModal.js
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { useTranslation } from "next-i18next";

export default function ProgressChecklistModal({ isOpen, onClose, tutorial }) {
  const { t } = useTranslation(["dashboard", "tutorials"]);
  if (!isOpen || !tutorial) return null;

  const checklist = [
    { label: t("dashboard:progressChecklistModal.title_description"), valid: tutorial.title && tutorial.description },
    { label: t("dashboard:progressChecklistModal.thumbnail"), valid: !!tutorial.thumbnail },
    {
      label: t("dashboard:progressChecklistModal.one_lesson"),
      valid:
        (Array.isArray(tutorial.lessons) && tutorial.lessons.length > 0) ||
        (Array.isArray(tutorial.chapters) && tutorial.chapters.length > 0) ||
        (typeof tutorial.lessonCount === "number" && tutorial.lessonCount > 0),
    },
    {
      label: t("dashboard:progressChecklistModal.category"),
      valid: !!tutorial.category_id || !!tutorial.categoryId,
    },
    { label: t("dashboard:progressChecklistModal.tags"), valid: tutorial.tags?.length > 0 },
    { label: t("dashboard:progressChecklistModal.language_level"), valid: tutorial.language && tutorial.level },
    { label: t("dashboard:progressChecklistModal.price_or_free"), valid: tutorial.price !== undefined },
    { label: t("dashboard:progressChecklistModal.quiz"), valid: tutorial.has_quiz || tutorial.quiz_questions?.length > 0 },
    { label: t("dashboard:progressChecklistModal.pending_approved"), valid: ["Pending", "Approved"].includes(tutorial.status) },
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

          <h2 className="text-xl font-bold mb-4 text-gray-800">{t("dashboard:progressChecklistModal.title")}</h2>
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
