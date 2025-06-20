// components/student/instructors/BookingRequestModal.js
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaCalendarCheck } from "react-icons/fa";
import { createStudentBooking } from "@/services/student/bookingService";
import { fetchInstructorAvailability } from "@/services/public/instructorService";

export default function BookingRequestModal({ instructor, onClose }) {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [type, setType] = useState("Tutorial");
  const [availability, setAvailability] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!instructor) return;
    const now = new Date();
    const start = new Date(now.getTime() + 3600 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    setStartTime(start.toISOString().slice(0, 16));
    setEndTime(end.toISOString().slice(0, 16));
    fetchInstructorAvailability(instructor.id)
      .then((slots) => setAvailability(slots))
      .catch(() => setAvailability([]));
  }, [instructor]);

  const isAvailable = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return availability.some((slot) => {
      if (!slot.daysOfWeek) return false;
      const dayMatch = slot.daysOfWeek.includes(startDate.getDay());
      const startRecur = slot.startRecur ? new Date(slot.startRecur) : null;
      if (startRecur && startDate < startRecur) return false;
      if (!dayMatch) return false;
      const [sh, sm] = slot.startTime.split(":");
      const [eh, em] = slot.endTime.split(":");
      const slotStart = new Date(startDate);
      slotStart.setHours(parseInt(sh), parseInt(sm), 0, 0);
      const slotEnd = new Date(startDate);
      slotEnd.setHours(parseInt(eh), parseInt(em), 0, 0);
      return startDate >= slotStart && endDate <= slotEnd;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const startIso = new Date(startTime).toISOString();
    const endIso = new Date(endTime).toISOString();
    if (!isAvailable(startIso, endIso)) {
      setError("This instructor is not available at the selected time.");
      return;
    }
    try {
      await createStudentBooking({
        instructor_id: instructor.id,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        notes: `${type} with ${instructor.name}`,
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Booking request failed", err);
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-60 z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-6 rounded-xl max-w-md w-full text-center"
      >
        {submitted ? (
          <>
            <h3 className="text-xl font-bold mb-3">Request Sent!</h3>
            <p className="text-gray-700">
              Lesson request sent to <strong>{instructor?.name}</strong>.
            </p>
            <button
              onClick={onClose}
              className="mt-4 bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600 flex items-center gap-2"
            >
              <FaCalendarCheck /> Close
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-xl font-bold">Request Lesson</h3>
            {error && (
              <p className="text-red-600 text-sm" data-testid="error">{error}</p>
            )}
            <div className="text-left">
              <label className="block mb-1 font-medium">Type</label>
              <select
                className="w-full border p-2 rounded"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option>Tutorial</option>
                <option>Online Class</option>
              </select>
            </div>
            <div className="text-left">
              <label className="block mb-1 font-medium">Start Time</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border p-2 rounded"
                required
              />
            </div>
            <div className="text-left">
              <label className="block mb-1 font-medium">End Time</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border p-2 rounded"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-600 flex items-center gap-2"
              >
                <FaCalendarCheck /> Send Request
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
