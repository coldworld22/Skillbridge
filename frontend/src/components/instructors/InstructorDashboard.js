import { useState, useEffect } from "react";
import { useTranslation } from "next-i18next";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import {
  FaChalkboardTeacher,
  FaCalendarAlt,
  FaUserGraduate,
  FaVideo,
} from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "tailwindcss/tailwind.css";
import {
  fetchInstructorDashboardStats,
  fetchInstructorTutorialViews,
} from "@/services/instructor/instructorService";
import { fetchInstructorScheduleEvents } from "@/services/instructor/classService";

const localizer = momentLocalizer(moment);


function InstructorDashboard() {
  const { t } = useTranslation('dashboard', { keyPrefix: 'instructorDashboardPage' });
  const [chartData, setChartData] = useState([]);
  const [counts, setCounts] = useState({});
  const [events, setEvents] = useState([]);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await fetchInstructorDashboardStats();
        if (data) setCounts(data);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      }
      try {
        const views = await fetchInstructorTutorialViews();
        const formatted = views.map((v, idx) => ({
          name: `Week ${idx + 1}`,
          views: v.views,
        }));
        setChartData(formatted);
      } catch (err) {
        console.error('Failed to load tutorial views', err);
      }
    }
    loadStats();
    async function loadEvents() {
      try {
        const data = await fetchInstructorScheduleEvents();
        const parsed = data.map((e) => ({
          ...e,
          start: new Date(e.start),
          ...(e.end ? { end: new Date(e.end) } : {}),
        }));
        setEvents(parsed);
      } catch (err) {
        console.error('Failed to load schedule events', err);
      }
    }
    loadEvents();
  }, []);

  const cardStyle = "bg-white shadow-sm border rounded-2xl p-5 hover:shadow-md transition duration-300";
  const customEventStyleGetter = () => ({
    style: {
      backgroundColor: "#facc15",
      borderRadius: "6px",
      padding: "2px 8px",
      color: "#1f2937",
      fontWeight: 500,
      fontSize: "0.85rem",
    },
  });

  return (
    <InstructorLayout>
      <div className="bg-gray-50 min-h-screen rounded-xl p-6 space-y-6 text-gray-800">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={cardStyle}>
            <FaChalkboardTeacher className="text-2xl mb-2 text-sky-600" />
            <p>{t('total_tutorials')}</p>
            <h2 className="text-xl font-semibold">{counts.totalTutorials ?? '...'}</h2>
          </div>
          <div className={cardStyle}>
            <FaVideo className="text-2xl mb-2 text-rose-600" />
            <p>{t('online_classes')}</p>
            <h2 className="text-xl font-semibold">{counts.totalClasses ?? '...'}</h2>
          </div>
          <div className={cardStyle}>
            <FaUserGraduate className="text-2xl mb-2 text-emerald-600" />
            <p>{t('enrolled_students')}</p>
            <h2 className="text-xl font-semibold">{counts.totalStudents ?? '...'}</h2>
          </div>
          <div className={cardStyle}>
            <FaCalendarAlt className="text-2xl mb-2 text-indigo-600" />
            <p>{t('upcoming_sessions')}</p>
            <h2 className="text-xl font-semibold">{counts.upcomingSessions ?? '...'}</h2>
          </div>
        </div>

        <div className={cardStyle}>
          <h2 className="text-xl font-bold border-b pb-2 mb-4">{t('tutorial_views_title')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="views" stroke="#0284c7" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={cardStyle}>
          <h2 className="text-xl font-bold border-b pb-2 mb-4">{t('calendar')}</h2>
          <div className="h-[500px]">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              defaultView="week"
              views={["month", "week", "day"]}
              style={{ height: "100%" }}
              eventPropGetter={customEventStyleGetter}
            />
          </div>
        </div>
      </div>
    </InstructorLayout>
  );
}




export default InstructorDashboard;
