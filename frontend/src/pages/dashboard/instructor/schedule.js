import { useEffect, useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import CalendarView from "@/components/shared/CalendarView";
import useScheduleStore from "@/store/schedule/scheduleStore";
import useScheduleStore from "@/store/schedule/scheduleStore";

export default function InstructorSchedule() {
  const scheduleEvents = useScheduleStore((state) => state.events);
  const [events, setEvents] = useState([]);


  useEffect(() => {
    const load = async () => {
      try {

        setLoading(true);
        const data = await fetchInstructorScheduleEvents();
        clear();
        addEvents(data);
      } catch (err) {
        console.error("Failed to load schedule", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [clear, addEvents]);


    setEvents([...confirmed, ...scheduleEvents]);
  }, [scheduleEvents]);


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
      {loading && (
        <p className="text-center text-gray-500 mt-4">Loading...</p>
      )}
      {!loading && events.length === 0 && (
        <p className="text-center text-gray-500 mt-4">No upcoming events</p>
      )}
    </InstructorLayout>
  );
}
