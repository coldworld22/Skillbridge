// components/student/instructors/ChatRedirectModal.js
import { motion } from "framer-motion";
import { FaComments, FaCheck, FaTimes } from "react-icons/fa";

export default function ChatRedirectModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-60 z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-6 rounded-xl max-w-md text-center"
      >
        <h3 className="text-xl font-bold mb-3">Open Chat</h3>
        <p className="text-gray-700">Start chatting with this instructor now?</p>
        <div className="mt-4 flex justify-center gap-4">
          <button
            onClick={onConfirm}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
          >
            <FaComments /> Yes, Open Chat
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}
