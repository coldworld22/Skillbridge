import { useEffect, useState } from "react";
import StudentLayout from "@/components/layouts/StudentLayout";
import CalendarView from "@/components/shared/CalendarView";

const currentStudentId = 1;
const mockBookings = [/* same data */];

export default function StudentSchedule() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const myLessons = mockBookings
      .filter((b) => b.status === "Accepted" && b.student.id === currentStudentId)
      .map((b) => ({
        id: b.id,
        title: `${b.subject} with ${b.instructor.name}`,
        start: `${b.date}T${b.time}`,
        extendedProps: {
          subject: b.subject,
          instructor: b.instructor.name
        }
      }));

    setEvents(myLessons);
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
