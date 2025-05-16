import { useEffect, useState } from "react";
import StudentLayout from "@/components/layouts/StudentLayout";
import { FaBook, FaClipboardList, FaCertificate, FaCalendarAlt, FaBullhorn, FaBell } from "react-icons/fa";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function StudentDashboardHome() {
  const [hasMounted, setHasMounted] = useState(false);
  const [studentName, setStudentName] = useState("Sara Ali");
  const [showNotifications, setShowNotifications] = useState(false);
  const [classes, setClasses] = useState([
    {
      id: "cls1",
      title: "React Basics",
      progress: 85,
      nextSession: "2025-05-12",
    },
    {
      id: "cls2",
      title: "Next.js Bootcamp",
      progress: 60,
      nextSession: "2025-05-15",
    },
  ]);

  const progressData = [
    { date: "May 1", progress: 10 },
    { date: "May 3", progress: 35 },
    { date: "May 5", progress: 50 },
    { date: "May 7", progress: 70 },
    { date: "May 9", progress: 85 },
  ];

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  return (
    <StudentLayout>
      <div className="p-6 space-y-6 text-gray-800">
        <div className="bg-yellow-100 p-4 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-1">👋 Welcome back, {studentName}!</h1>
          <p className="text-sm text-gray-700">You're enrolled in {classes.length} classes. Keep up the good work!</p>
        </div>

        {/* Progress Chart */}
        <section className="bg-white border border-gray-200 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">📈 Learning Progress</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={progressData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Line type="monotone" dataKey="progress" stroke="#facc15" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </section>

        {/* Upcoming Events */}
        <section>
          <h2 className="text-lg font-semibold mb-3">📅 Upcoming Events</h2>
          <div className="bg-white p-4 rounded-lg shadow max-h-48 overflow-y-auto divide-y">
            <div className="py-2 text-sm text-gray-800">May 12 – <span className="font-semibold">React Basics:</span> Live Session</div>
            <div className="py-2 text-sm text-gray-800">May 14 – <span className="font-semibold">Next.js Bootcamp:</span> Final Quiz Due</div>
            <div className="py-2 text-sm text-gray-800">May 18 – Group Project Kickoff</div>
          </div>
        </section>

        {/* Announcements */}
        <section className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-blue-700 flex items-center gap-2">
            <FaBullhorn className="text-blue-500" /> Instructor Announcements
          </h2>
          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto divide-y">
            <div className="py-2 text-sm text-gray-800">
              <strong>React Basics:</strong> <span className="text-gray-600">"Bonus session added on May 16." – Ahmed</span>
            </div>
            <div className="py-2 text-sm text-gray-800">
              <strong>Next.js Bootcamp:</strong> <span className="text-gray-600">"Submit your final quiz before May 14." – Noor</span>
            </div>
          </div>
        </section>

        {/* Classes Progress */}
        <section>
          <h2 className="text-lg font-semibold mb-3">📘 Current Classes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map(cls => (
              <div key={cls.id} className="bg-white border rounded-lg shadow-sm p-4 space-y-2">
                <h3 className="font-semibold text-gray-800">{cls.title}</h3>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${cls.progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">Progress: {cls.progress}%</p>
                <p className="text-sm text-gray-600">Next session: {cls.nextSession}</p>
                <a href={`/dashboard/student/classes/${cls.id}`} className="inline-block mt-2 text-sm text-blue-600 hover:underline">
                  View Class
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Stats */}
        <section>
          <h2 className="text-lg font-semibold mb-3">📊 Quick Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow flex items-center gap-3">
              <FaClipboardList className="text-yellow-500 text-xl" />
              <div>
                <p className="text-sm text-gray-500">Assignments</p>
                <p className="text-lg font-bold">2 Pending</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow flex items-center gap-3">
              <FaCalendarAlt className="text-blue-500 text-xl" />
              <div>
                <p className="text-sm text-gray-500">Attendance</p>
                <p className="text-lg font-bold">7/9</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow flex items-center gap-3">
              <FaBook className="text-green-500 text-xl" />
              <div>
                <p className="text-sm text-gray-500">Last Grade</p>
                <p className="text-lg font-bold">B+</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow flex items-center gap-3">
              <FaCertificate className="text-purple-500 text-xl" />
              <div>
                <p className="text-sm text-gray-500">Certificates</p>
                <p className="text-lg font-bold">1 Earned</p>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="text-lg font-semibold mb-3">🕓 Recent Activity</h2>
          <div className="bg-white p-4 rounded-lg shadow max-h-48 overflow-y-auto divide-y">
            <div className="py-2 text-sm text-gray-800">May 5 - You submitted Final Project</div>
            <div className="py-2 text-sm text-gray-800">May 3 - You attended session</div>
            <div className="py-2 text-sm text-gray-800">May 2 - You earned grade A+</div>
          </div>
        </section>

        {/* Certificate CTA */}
        <section className="bg-purple-50 border-l-4 border-purple-400 p-6 rounded-lg shadow text-center">
          <h2 className="text-lg font-semibold text-purple-700 mb-1">🎓 Certificate Ready!</h2>
          <p className="text-sm text-gray-700 mb-3">You've met all the requirements for "React Basics".</p>
          <a
            href="/dashboard/student/certificates"
            className="inline-block px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
          >
            🎖️ Download Your Certificate
          </a>
        </section>
      </div>
    </StudentLayout>
  );
}