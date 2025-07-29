import { useEffect, useState } from "react";
import StudentLayout from "@/components/layouts/StudentLayout";
import CalendarView from "@/components/shared/CalendarView";
import { fetchStudentBookings } from "@/services/student/bookingService";

export default function StudentSchedule() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const bookings = await fetchStudentBookings();
        const approved = bookings.filter((b) => b.status === "approved");
        const mapped = approved.map((b) => ({
          id: b.id,
          title: `${b.subject || "Lesson"} with ${b.instructor_name}`,
          start: b.start_time,
          end: b.end_time,
          extendedProps: {
            subject: b.subject || "Lesson",
            instructor: b.instructor_name,
          },
        }));
        setEvents(mapped);
      } catch (err) {
        console.error("Failed to load bookings", err);
      }
    };

    load();
  }, []);

  return (
    <StudentLayout>
      <CalendarView
        title="My Booked Lessons"
        events={events}
        onEventClick={(info) => {
          alert(`📚 ${info.event.extendedProps.subject}\n👨‍🏫 Instructor: ${info.event.extendedProps.instructor}`);
        }}
      />
    </StudentLayout>
  );
}
