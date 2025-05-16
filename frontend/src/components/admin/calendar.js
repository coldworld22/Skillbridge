import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import AdminLayout from '@/components/layouts/AdminLayout';
import '@fullcalendar/common/main.css';
import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/timegrid/main.css';

export default function AdminCalendarPage() {
  const [events, setEvents] = useState([
    {
      id: '1',
      title: 'React Bootcamp',
      start: '2025-04-17T10:00:00',
      end: '2025-04-17T12:00:00',
    },
    {
      id: '2',
      title: 'Design Thinking Workshop',
      start: '2025-04-18T14:00:00',
      end: '2025-04-18T16:00:00',
    },
  ]);

  const handleDateClick = (info) => {
    const title = prompt('Enter class title:');
    if (title) {
      const newEvent = {
        id: String(events.length + 1),
        title,
        start: info.dateStr,
        end: info.dateStr,
      };
      setEvents([...events, newEvent]);
    }
  };

  const handleEventDrop = (info) => {
    const updated = events.map((event) =>
      event.id === info.event.id
        ? { ...event, start: info.event.startStr, end: info.event.endStr }
        : event
    );
    setEvents(updated);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">📅 Full Live Class Calendar</h1>

      <div className="bg-white p-4 rounded-xl shadow overflow-x-auto">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          editable={true}
          selectable={true}
          events={events}
          dateClick={handleDateClick}
          eventDrop={handleEventDrop}
          height="auto"
        />
      </div>
    </div>
  );
}

AdminCalendarPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
