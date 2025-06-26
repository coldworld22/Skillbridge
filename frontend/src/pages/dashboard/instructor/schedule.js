import { useEffect, useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import CalendarView from "@/components/shared/CalendarView";
import { fetchInstructorScheduleEvents } from "@/services/instructor/classService";

export default function InstructorSchedule() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchInstructorScheduleEvents();
        setEvents(data);
      } catch (err) {
        console.error("Failed to load schedule", err);
      }
    };
    load();
  }, []);

  return (
    <InstructorLayout>
      <CalendarView
        title="My Teaching Schedule"
        events={events}
        onEventClick={(info) => {
          const sub = info.event.extendedProps?.subject;
          const student = info.event.extendedProps?.student;
          if (sub && student) {
            alert(`📚 ${sub}\n👤 Student: ${student}`);
          } else {
            alert(info.event.title);
          }
        }}
      />
    </InstructorLayout>
  );
}
