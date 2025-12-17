// components/student/instructors/ChatRedirectModal.js
import { motion } from "framer-motion";
import { FaComments } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import modalStyles from "@/components/common/Modal.module.scss";

export default function ChatRedirectModal({ onConfirm, onCancel }) {
  return (
    <div className={modalStyles.simpleOverlay}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={modalStyles.panel}
        style={{ maxWidth: "26rem", textAlign: "center" }}
      >
        <h3 className={modalStyles.title}>Open Chat</h3>
        <p className={modalStyles.muted}>Start chatting with this instructor now?</p>
        <div className={modalStyles.ctaRow} style={{ justifyContent: "center" }}>
          <Button onClick={onConfirm} variant="accent">
            <FaComments /> Yes, Open Chat
          </Button>
          <Button onClick={onCancel} variant="neutral">
            Cancel
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
