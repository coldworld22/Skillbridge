import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import styles from "./CalendarView.module.scss";

export default function CalendarViewClient({
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
    <section className={`${styles.section} ${className}`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.titleRow}>
            <span aria-hidden="true">📅</span>
            <span className={styles.title}>{title}</span>
          </h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
      <div className={styles.body}>
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
