import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function CalendarView({
  events,
  title = "Schedule",
  subtitle,
  onEventClick,
  actions,
  className = "",
  initialView = "timeGridWeek",
  eventContent,
}) {
  return (
    <section
      className={`overflow-hidden rounded-3xl border border-gray-200 bg-white/80 shadow-xl backdrop-blur ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 px-6 py-5 text-white">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold leading-tight">
            <span aria-hidden="true">📅</span>
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-gray-300">{subtitle}</p>}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="bg-white px-2 py-4 sm:px-4 sm:py-6">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={initialView}
          events={events}
          eventContent={eventContent}
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            meridiem: true,
          }}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          height="auto"
          eventClick={onEventClick}
        />
      </div>
    </section>
  );
}
