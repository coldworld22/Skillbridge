import { useState, useEffect } from "react";
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

const localizer = momentLocalizer(moment);

const mockChartData = [
  { name: 'Week 1', views: 420 },
  { name: 'Week 2', views: 620 },
  { name: 'Week 3', views: 580 },
  { name: 'Week 4', views: 760 },
];

const mockTutorials = [
  { id: 1, title: "React Basics", status: "Draft" },
  { id: 2, title: "Advanced Next.js", status: "Published" },
  { id: 3, title: "JavaScript ES6", status: "Archived" },
];

const mockClasses = [
  { id: 1, title: "React Live Session", date: "2025-05-05", time: "10:00 AM" },
  { id: 2, title: "Final Q&A", date: "2025-05-07", time: "02:00 PM" },
];

const mockStudents = [
  { id: 1, name: "Sara Ali", email: "sara@example.com", classTitle: "React Basics" },
  { id: 2, name: "Omar Nasser", email: "omar@example.com", classTitle: "Advanced Next.js" },
];

const mockAssignments = [
  { id: 1, title: "React Components Homework", dueDate: "2025-05-08" },
  { id: 2, title: "Next.js Dynamic Routing", dueDate: "2025-05-10" },
];

const mockCertificates = [
  { id: 1, student: "Sara Ali", classTitle: "React Basics", issueDate: "2025-05-01" },
  { id: 2, student: "Omar Nasser", classTitle: "Next.js Bootcamp", issueDate: "2025-05-02" },
];

const mockDashboardCounts = {
  totalTutorials: 8,
  totalClasses: 4,
  totalStudents: 156,
  upcomingSessions: 3,
};

const mockEvents = [
  {
    title: "React Basics - Live Class",
    start: new Date(moment().add(1, 'days').set({ hour: 10, minute: 0 }).toISOString()),
    end: new Date(moment().add(1, 'days').set({ hour: 12, minute: 0 }).toISOString()),
  },
  {
    title: "Final Exam Review",
    start: new Date(moment().add(3, 'days').set({ hour: 14, minute: 0 }).toISOString()),
    end: new Date(moment().add(3, 'days').set({ hour: 15, minute: 30 }).toISOString()),
  },
];

const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();

export default function InstructorDashboard() {
  const [activeTab, setActiveTab] = useState("tutorials");
  const [chartData, setChartData] = useState([]);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    setTimeout(() => {
      setChartData(mockChartData);
      setCounts(mockDashboardCounts);
    }, 500);
  }, []);

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

  return (
    <InstructorLayout>
      <div className="bg-gray-50 min-h-screen rounded-xl p-6 space-y-6 text-gray-800">
        <h1 className="text-3xl font-bold tracking-tight">Instructor Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={cardStyle}>
            <FaChalkboardTeacher className="text-2xl mb-2 text-sky-600" />
            <p>Total Tutorials</p>
            <h2 className="text-xl font-semibold">{counts.totalTutorials ?? '...'}</h2>
          </div>
          <div className={cardStyle}>
            <FaVideo className="text-2xl mb-2 text-rose-600" />
            <p>Online Classes</p>
            <h2 className="text-xl font-semibold">{counts.totalClasses ?? '...'}</h2>
          </div>
          <div className={cardStyle}>
            <FaUserGraduate className="text-2xl mb-2 text-emerald-600" />
            <p>Enrolled Students</p>
            <h2 className="text-xl font-semibold">{counts.totalStudents ?? '...'}</h2>
          </div>
          <div className={cardStyle}>
            <FaCalendarAlt className="text-2xl mb-2 text-indigo-600" />
            <p>Upcoming Sessions</p>
            <h2 className="text-xl font-semibold">{counts.upcomingSessions ?? '...'}</h2>
          </div>
        </div>

        <div className={cardStyle}>
          <h2 className="text-xl font-bold border-b pb-2 mb-4">Tutorial Views (Last 4 Weeks)</h2>
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
          <h2 className="text-xl font-bold border-b pb-2 mb-4">Calendar</h2>
          <div className="h-[500px]">
            <Calendar
              localizer={localizer}
              events={mockEvents}
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
                {tab.charAt(0).toUpperCase() + tab.slice(1).replace(/([A-Z])/g, ' $1')}
              </button>
            ))}
          </div>

         {/* Tab Content */}
{activeTab === "tutorials" && (
  <div className={cardStyle}>
    <h3 className="font-semibold text-lg mb-2">My Tutorials</h3>
    <button className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4 py-2 rounded mb-4">
      Create New Tutorial
    </button>
    <ul className="space-y-2">
      {mockTutorials.map((tutorial) => (
        <li key={tutorial.id} className="flex items-center justify-between border rounded p-3">
          <div>
            <h4 className="font-semibold">{tutorial.title}</h4>
            <p className="text-sm text-gray-500">Status: {tutorial.status}</p>
          </div>
          <div className="space-x-2">
            <button className="text-sky-600 hover:underline">Edit</button>
            <button className="text-green-600 hover:underline">View</button>
          </div>
        </li>
      ))}
    </ul>
  </div>
)}

{activeTab === "classes" && (
  <div className={cardStyle}>
    <h3 className="font-semibold text-lg mb-2">My Online Classes</h3>
    <button className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4 py-2 rounded mb-4">
      Schedule New Class
    </button>
    <ul className="space-y-3">
      {mockClasses.map((cls) => (
        <li key={cls.id} className="flex justify-between items-center p-3 border rounded">
          <div>
            <h4 className="font-semibold">{cls.title}</h4>
            <p className="text-sm text-gray-500">{cls.date} @ {cls.time}</p>
          </div>
          <div className="space-x-2">
            <button className="text-sky-600 hover:underline">Edit</button>
            <button className="text-rose-600 hover:underline">Cancel</button>
          </div>
        </li>
      ))}
    </ul>
  </div>
)}

{activeTab === "students" && (
  <div className={cardStyle}>
    <h3 className="font-semibold text-lg mb-2">Enrolled Students</h3>
    <table className="w-full mt-4 table-auto">
      <thead>
        <tr className="text-left border-b">
          <th className="py-2">Name</th>
          <th>Email</th>
          <th>Class</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {mockStudents.map((student) => (
          <tr key={student.id} className="border-b">
            <td className="py-2">{student.name}</td>
            <td>{student.email}</td>
            <td>{student.classTitle}</td>
            <td>
              <button className="text-sky-600 hover:underline">View</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

{activeTab === "assignments" && (
  <div className={cardStyle}>
    <h3 className="font-semibold text-lg mb-2">Assignments</h3>
    <button className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4 py-2 rounded mb-4">
      Create Assignment
    </button>
    <ul className="space-y-2">
      {mockAssignments.map((assignment) => (
        <li key={assignment.id} className="border p-3 rounded flex justify-between items-center">
          <div>
            <h4 className="font-semibold">{assignment.title}</h4>
            <p className="text-sm text-gray-500">Due: {assignment.dueDate}</p>
          </div>
          <div className="space-x-2">
            <button className="text-sky-600 hover:underline">Submissions</button>
            <button className="text-rose-600 hover:underline">Edit</button>
          </div>
        </li>
      ))}
    </ul>
  </div>
)}

{activeTab === "certificates" && (
  <div className={cardStyle}>
    <h3 className="font-semibold text-lg mb-2">Certificates</h3>
    <input
      type="text"
      placeholder="Search students or classes"
      className="border px-3 py-2 rounded w-full mb-4"
    />
    <ul className="space-y-2">
      {mockCertificates.map(cert => (
        <li key={cert.id} className="flex justify-between items-center border rounded p-3">
          <div>
            <h4 className="font-semibold">{cert.student}</h4>
            <p className="text-sm text-gray-500">Class: {cert.classTitle} | Issued: {cert.issueDate}</p>
          </div>
          <div className="space-x-2">
            <button className="text-green-600 hover:underline">Preview</button>
            <button className="text-sky-600 hover:underline">Download</button>
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
