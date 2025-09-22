import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "next-i18next";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import {
  FaChalkboardTeacher,
  FaCalendarAlt,
  FaUserGraduate,
  FaVideo,
  FaEye,
  FaDownload,
  FaEdit,
  FaPlus
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
import {
  fetchInstructorScheduleEvents,
  fetchInstructorClasses,
} from "@/services/instructor/classService";
import { fetchInstructorTutorials } from "@/services/instructor/tutorialService";
import { instructorDashboardMocks } from "@/mocks/data";
import useAuthStore from "@/store/auth/authStore";

const localizer = momentLocalizer(moment);


// In development we display local mock data. In production the lists below
// are populated via service calls to the backend API. See the useEffect hook
// for the fetching logic.

function InstructorDashboard() {
  const { t } = useTranslation('dashboard', { keyPrefix: 'instructorDashboardPage' });
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState("tutorials");
  const [chartData, setChartData] = useState([]);
  const [counts, setCounts] = useState({});
  const [events, setEvents] = useState([]);
  const [tutorials, setTutorials] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classesLoaded, setClassesLoaded] = useState(false);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [certificates, setCertificates] = useState([]);

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
    async function loadLists() {
      setClassesLoaded(false);
      if (process.env.NODE_ENV === 'development') {
        const { tutorials, classes, students, assignments, certificates } =
          instructorDashboardMocks;
        setTutorials(tutorials);
        setClasses(classes);
        setStudents(students);
        setAssignments(assignments);
        setCertificates(certificates);
        setClassesLoaded(true);
        return;
      }

      if (!user?.id) return;

      try {
        const tuts = await fetchInstructorTutorials();
        setTutorials(tuts);
      } catch (err) {
        console.error('Failed to load tutorials', err);
      }

      try {
        const cls = await fetchInstructorClasses(user.id);
        setClasses(cls);
      } catch (err) {
        console.error('Failed to load classes', err);
      } finally {
        setClassesLoaded(true);
      }

      // Students, assignments and certificates would be fetched through
      // their respective services once available.
    }
    loadLists();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !classesLoaded) return;

    let isMounted = true;
    async function loadEvents() {
      try {
        const data = await fetchInstructorScheduleEvents(user.id, classes);
        if (isMounted) setEvents(data);
      } catch (err) {
        console.error('Failed to load schedule events', err);
      }
    }

    loadEvents();
    return () => {
      isMounted = false;
    };
  }, [user?.id, classesLoaded, classes]);

  const cardStyle = "bg-white shadow-sm border rounded-2xl p-5 hover:shadow-md transition duration-300";
  const tabButtonStyle = (tab) =>
    `py-2 px-4 text-sm rounded-full font-semibold transition-all duration-300 border ${
      activeTab === tab
        ? "bg-sky-600 text-white border-sky-600 shadow"
        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
    }`;

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

  const formatClassSchedule = useMemo(
    () =>
      (cls) => {
        const startSource = cls?.startDateTime || cls?.start_date || null;
        if (!startSource) return t("schedule_tbd", "Schedule TBD");

        const start = new Date(startSource);
        if (Number.isNaN(start.getTime())) return t("schedule_tbd", "Schedule TBD");

        return new Intl.DateTimeFormat(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(start);
      },
    [t],
  );

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

        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            {['tutorials', 'classes', 'students', 'assignments', 'certificates'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={tabButtonStyle(tab)}
              >
                {t(`tabs.${tab}`)}
              </button>
            ))}
          </div>

         {/* Tab Content */}
{activeTab === "tutorials" && (
  <div className={cardStyle}>
    <h3 className="font-semibold text-lg mb-2">{t('my_tutorials')}</h3>
    <button className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4 py-2 rounded mb-4">
      {t('create_tutorial')}
    </button>
    <ul className="space-y-2">
      {tutorials.map((tutorial) => (
        <li key={tutorial.id} className="flex items-center justify-between border rounded p-3">
          <div>
            <h4 className="font-semibold">{tutorial.title}</h4>
            <p className="text-sm text-gray-500">Status: {tutorial.status}</p>
          </div>
          <div className="space-x-2">
            <button className="text-sky-600 hover:underline">{t('edit')}</button>
            <button className="text-green-600 hover:underline">{t('view')}</button>
          </div>
        </li>
      ))}
    </ul>
  </div>
)}

{activeTab === "classes" && (
  <div className={cardStyle}>
    <h3 className="font-semibold text-lg mb-2">{t('my_online_classes')}</h3>
    <button className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4 py-2 rounded mb-4">
      {t('schedule_class')}
    </button>
    <ul className="space-y-3">
      {classes.map((cls) => (
        <li key={cls.id} className="flex justify-between items-center p-3 border rounded">
          <div>
            <h4 className="font-semibold">{cls.title}</h4>
            <p className="text-sm text-gray-500">{formatClassSchedule(cls)}</p>
          </div>
          <div className="space-x-2">
            <button className="text-sky-600 hover:underline">{t('edit')}</button>
            <button className="text-rose-600 hover:underline">{t('cancel')}</button>
          </div>
        </li>
      ))}
    </ul>
  </div>
)}

{activeTab === "students" && (
  <div className={cardStyle}>
    <h3 className="font-semibold text-lg mb-2">{t('enrolled_students_tab')}</h3>
    <table className="w-full mt-4 table-auto">
      <thead>
        <tr className="text-left border-b">
          <th className="py-2">{t('name')}</th>
          <th>{t('email')}</th>
          <th>{t('class')}</th>
          <th>{t('actions')}</th>
        </tr>
      </thead>
      <tbody>
        {students.map((student) => (
          <tr key={student.id} className="border-b">
            <td className="py-2">{student.name}</td>
            <td>{student.email}</td>
            <td>{student.classTitle}</td>
            <td>
              <button className="text-sky-600 hover:underline">{t('view')}</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

{activeTab === "assignments" && (
  <div className={cardStyle}>
    <h3 className="font-semibold text-lg mb-2">{t('assignments_title')}</h3>
    <button className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4 py-2 rounded mb-4">
      {t('create_assignment')}
    </button>
    <ul className="space-y-2">
      {assignments.map((assignment) => (
        <li key={assignment.id} className="border p-3 rounded flex justify-between items-center">
          <div>
            <h4 className="font-semibold">{assignment.title}</h4>
            <p className="text-sm text-gray-500">Due: {assignment.dueDate}</p>
          </div>
          <div className="space-x-2">
            <button className="text-sky-600 hover:underline">{t('submissions')}</button>
            <button className="text-rose-600 hover:underline">{t('edit')}</button>
          </div>
        </li>
      ))}
    </ul>
  </div>
)}

{activeTab === "certificates" && (
  <div className={cardStyle}>
    <h3 className="font-semibold text-lg mb-2">{t('certificates_title')}</h3>
    <input
      type="text"
      placeholder={t('search_placeholder')}
      className="border px-3 py-2 rounded w-full mb-4"
    />
    <ul className="space-y-2">
      {certificates.map(cert => (
        <li key={cert.id} className="flex justify-between items-center border rounded p-3">
          <div>
            <h4 className="font-semibold">{cert.student}</h4>
            <p className="text-sm text-gray-500">Class: {cert.classTitle} | Issued: {cert.issueDate}</p>
          </div>
          <div className="space-x-2">
            <button className="text-green-600 hover:underline">{t('preview')}</button>
            <button className="text-sky-600 hover:underline">{t('download')}</button>
          </div>
        </li>
      ))}
    </ul>
  </div>
)}

        </div>
      </div>
    </InstructorLayout>
  );
}




export default InstructorDashboard;
