// components/student/instructors/BookingCard.js
import { FaCalendarAlt, FaComments, FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-700",
  Accepted: "bg-green-100 text-green-700",
  Completed: "bg-gray-200 text-gray-700",
};

export default function BookingCard({ booking, onCancel, onChat }) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="bg-white p-4 rounded-lg shadow flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <img
          src={booking.instructor.avatar}
          alt={booking.instructor.name}
          className="w-14 h-14 rounded-full border"
        />
        <div>
          <h3 className="font-semibold">{booking.instructor.name}</h3>
          <p className="text-sm text-gray-600">{booking.subject}</p>
          <p className="text-sm text-gray-500">
            <FaCalendarAlt className="inline mr-1" /> {booking.date}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={`text-sm px-3 py-1 rounded-full ${statusColors[booking.status]}`}>
          {booking.status}
        </span>

        <button
          onClick={onChat}
          className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1"
        >
          <FaComments /> Chat
        </button>

        {booking.status === "Pending" && (
          <button
            onClick={onCancel}
            className="px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1"
          >
            <FaTimes /> Cancel
          </button>
        )}
      </div>
    </motion.div>
  );
}
