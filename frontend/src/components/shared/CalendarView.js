import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function CalendarView({ events, title = "Schedule", onEventClick }) {
  return (
    <section className="py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">📅 {title}</h1>

      <div className="bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          events={events}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: true
          }}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay"
          }}
          height="auto"
          eventClick={onEventClick}
        />
      </div>
    </section>
  );
}
