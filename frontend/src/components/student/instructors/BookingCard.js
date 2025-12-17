// components/student/instructors/BookingCard.js
import { FaCalendarAlt, FaComments, FaTimes } from 'react-icons/fa';
import { motion } from 'framer-motion';
import StatusBadge from '@/components/shared/ui/StatusBadge';

export default function BookingCard({ booking, onCancel, onChat }) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-4 text-left">
        <img
          src={booking.instructor.avatar}
          alt={booking.instructor.name}
          className="h-16 w-16 rounded-full border border-gray-200 object-cover"
        />
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-gray-900">{booking.instructor.name}</h3>
          <p className="text-sm text-gray-600">{booking.subject}</p>
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <FaCalendarAlt className="text-gray-400" />
            {booking.date}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:items-end sm:text-right">
        <StatusBadge status={booking.status} />

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={onChat}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <FaComments /> Chat
          </button>

          {booking.status === 'pending' && (
            <button
              onClick={onCancel}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
            >
              <FaTimes /> Cancel
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
