// components/student/instructors/BookingRequestModal.js
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaCalendarCheck } from "react-icons/fa";
import { toast } from "react-toastify";

import useAuthStore from "@/store/auth/authStore";

import {
  createStudentBooking,
  fetchStudentBookings,
} from "@/services/student/bookingService";
import { fetchInstructorAvailability } from "@/services/public/instructorService";

export default function BookingRequestModal({ instructor, onClose }) {

  const { user } = useAuthStore();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [type, setType] = useState("Tutorial");
  const [availability, setAvailability] = useState([]);
  const [error, setError] = useState("");
  const [hasPending, setHasPending] = useState(false);

  // Ensure only logged in students can book
  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== "student") {
      toast.info(
        "Please login as a student or create a student account to proceed."
      );
      onClose();

    }
  }, [user, onClose]);

    

  useEffect(() => {
    if (!instructor) return;
    const now = new Date();
    const start = new Date(now.getTime() + 3600 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    setStartTime(start.toISOString().slice(0, 16));
    setEndTime(end.toISOString().slice(0, 16));
    fetchInstructorAvailability(instructor.id)
      .then(setAvailability)
      .catch(() => setAvailability([]));
    fetchStudentBookings()
      .then((bookings) => {
        const pending = bookings.find(
          (b) => b.instructor_id === instructor.id && b.status === "pending"
        );
        if (pending) {
          setHasPending(true);
          toast.info(
            "You already have a pending request with this instructor."
          );
        }
      })
      .catch(() => {});
  }, [instructor]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const isAvailable = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (startDate.toDateString() !== endDate.toDateString()) return false;
    return availability.some((slot) => {
      if (!slot.daysOfWeek) return false;
      const dayMatch =
        slot.daysOfWeek.includes(startDate.getDay()) &&
        slot.daysOfWeek.includes(endDate.getDay());
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
    if (hasPending) {
      toast.info(
        "You already have a pending request with this instructor."
      );
      return;
    }
    const startIso = new Date(startTime).toISOString();
    const endIso = new Date(endTime).toISOString();
    if (!isAvailable(startIso, endIso)) {
      setError("This instructor is not available at the selected time.");
      return;
    }
    try {
      await createStudentBooking({
        instructor_id: instructor.id,
        start_time: startIso,
        end_time: endIso,
        notes: `${type} with ${instructor.name}`,
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Booking request failed", err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-md mx-4 rounded-2xl shadow-lg p-6 md:p-8 relative"
      >
        {submitted ? (
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-green-600 mb-2">Request Sent!</h3>
            <p className="text-gray-700 mb-4">
              Your lesson request has been sent to <strong>{instructor?.name}</strong>.
            </p>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg"
            >
              <FaCalendarCheck /> Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <h3 className="text-2xl font-bold text-gray-800 text-center">Request Lesson</h3>

            {hasPending && (
              <p className="text-blue-600 text-sm text-center">
                You already have a pending request with this instructor.
              </p>
            )}

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div>
              <label className="block text-sm font-medium text-yellow-700 mb-1">Type</label>
              <select
                className="w-full border-gray-300 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option>Tutorial</option>
                <option>Online Class</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-yellow-700 mb-1">Start Time</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full border-gray-300 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-yellow-700 mb-1">End Time</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full border-black-300 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div className="flex justify-between gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 px-4 py-2 bg-blue-500 text-black font-semibold rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 px-4 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-600 flex items-center justify-center gap-2"
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
