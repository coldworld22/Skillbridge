// components/student/instructors/BookingRequestModal.js
import { useEffect } from "react";
import { motion } from "framer-motion";
import { FaCalendarCheck } from "react-icons/fa";
import { createStudentBooking } from "@/services/student/bookingService";

export default function BookingRequestModal({ instructor, onClose }) {
  useEffect(() => {
    if (!instructor) return;
    const now = new Date();
    const start = new Date(now.getTime() + 3600 * 1000); // default 1h from now
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1h duration
    createStudentBooking({
      instructor_id: instructor.id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      notes: `Auto booked with ${instructor.name}`,
    }).catch((err) => {
      console.error("Booking request failed", err);
    });
  }, [instructor]);

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-60 z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-6 rounded-xl max-w-md text-center"
      >
        <h3 className="text-xl font-bold mb-3">Request Sent!</h3>
        <p className="text-gray-700">Lesson request sent to <strong>{instructor?.name}</strong>.</p>
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
