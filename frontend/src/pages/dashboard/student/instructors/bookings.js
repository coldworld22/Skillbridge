import { useState, useEffect } from "react";
import StudentLayout from "@/components/layouts/StudentLayout";
import BookingCard from "@/components/student/instructors/BookingCard";
import {
  fetchStudentBookings,
  deleteStudentBooking,
} from "@/services/student/bookingService";

export default function StudentBookings() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const loadBookings = async () => {
      const data = await fetchStudentBookings();
      setBookings(data);
    };
    loadBookings();
  }, []);

  const handleCancel = async (id) => {
    const confirm = window.confirm("Are you sure you want to cancel this request?");
    if (confirm) {
      await deleteStudentBooking(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const handleChat = (instructorId) => {
    window.location.href = `/messages?userId=${instructorId}`;
  };

  return (
    <StudentLayout>
      <section className="py-10 px-4">
        <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

        {bookings.length === 0 ? (
          <p className="text-gray-600 text-center">No bookings yet.</p>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                onCancel={() => handleCancel(b.id)}
                onChat={() => handleChat(b.instructor.id)}
              />
            ))}
          </div>
        )}
      </section>
    </StudentLayout>
  );
}
