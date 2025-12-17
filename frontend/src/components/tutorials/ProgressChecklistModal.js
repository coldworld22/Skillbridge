// components/tutorials/ProgressChecklistModal.js
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { useTranslation } from "next-i18next";
import modalStyles from "@/components/common/Modal.module.scss";
import styles from "./ProgressChecklistModal.module.scss";

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
        className={modalStyles.simpleOverlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={modalStyles.panel}
          style={{ maxWidth: "28rem", position: "relative" }}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className={modalStyles.closeButton}
            style={{ position: "absolute", top: "0.75rem", right: "1rem" }}
            aria-label="Close"
          >
            <FaTimes />
          </button>

          <h2 className={modalStyles.title}>
            {t("dashboard:progressChecklistModal.title")}
          </h2>
          <ul className={styles.list}>
            {checklist.map((item, idx) => (
              <li
                key={idx}
                className={`${styles.item} ${item.valid ? styles.valid : styles.invalid}`}
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
