// components/student/instructors/BookingRequestModal.js
import { motion } from "framer-motion";
import { FaComments, FaCheck, FaTimes, FaCalendarCheck  } from "react-icons/fa";

export default function BookingRequestModal({ instructorName, onClose }) {
  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-60 z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-6 rounded-xl max-w-md text-center"
      >
        <h3 className="text-xl font-bold mb-3">Request Sent!</h3>
        <p className="text-gray-700">Lesson request sent to <strong>{instructorName}</strong>.</p>
        <button
          onClick={onClose}
          className="mt-4 bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600 flex items-center gap-2"
        >
          <FaCalendarCheck /> Close
        </button>
      </motion.div>
    </div>
  );
}
