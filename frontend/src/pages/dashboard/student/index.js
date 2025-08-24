import { useEffect, useState } from "react";
import StudentLayout from "@/components/layouts/StudentLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fetchMyEnrolledClasses } from "@/services/classService";
import { getStudentProfile } from "@/services/student/studentService";

function StudentDashboardHome() {
  const [hasMounted, setHasMounted] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [classes, setClasses] = useState([]);
  const [progressData, setProgressData] = useState([]);

  useEffect(() => {
    setHasMounted(true);
    const load = async () => {
      try {
        const profile = await getStudentProfile();
        setStudentName(profile.full_name);
      } catch (err) {
        console.error("Failed to load profile", err);
      }

      try {
        const list = await fetchMyEnrolledClasses();
        const formatted = list.map((cls) => ({
          id: cls.id,
          title: cls.title,
          progress: cls.progress,
          nextSession: cls.startDate,
        }));
        setClasses(formatted);

        const progressChart = formatted.map((cls, index) => ({
          date: cls.nextSession
            ? new Date(cls.nextSession).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : `Class ${index + 1}`,
          progress: cls.progress,
        }));
        setProgressData(progressChart);
      } catch (err) {
        console.error("Failed to load classes", err);
      }
    };

    load();
  }, []);

  if (!hasMounted) return null;

  return (
    <StudentLayout>
      <div className="p-6 space-y-6 text-gray-800">
        <div className="bg-yellow-100 p-4 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-1">👋 Welcome back, {studentName}!</h1>
          <p className="text-sm text-gray-700">
            You&apos;re enrolled in {classes.length} classes. Keep up the good work!
          </p>
        </div>

        {/* Progress Chart */}
        {progressData.length > 0 && (
          <section className="bg-white border border-gray-200 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3">📈 Learning Progress</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={progressData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Line
                  type="monotone"
                  dataKey="progress"
                  stroke="#facc15"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </section>
        )}

        {/* Upcoming Events */}
        <section>
          <h2 className="text-lg font-semibold mb-3">📅 Upcoming Events</h2>
          <div className="bg-white p-4 rounded-lg shadow max-h-48 overflow-y-auto divide-y">
            {classes.length > 0 ? (
              classes.map((cls) => (
                <div key={cls.id} className="py-2 text-sm text-gray-800">
                  {cls.nextSession} – <span className="font-semibold">{cls.title}</span>
                </div>
              ))
            ) : (
              <div className="py-2 text-sm text-gray-600">No upcoming events</div>
            )}
          </div>
        </section>

        {/* Classes Progress */}
        <section>
          <h2 className="text-lg font-semibold mb-3">📘 Current Classes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-white border rounded-lg shadow-sm p-4 space-y-2"
              >
                <h3 className="font-semibold text-gray-800">{cls.title}</h3>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${cls.progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  Progress: {cls.progress}%
                </p>
                <p className="text-sm text-gray-600">
                  Next session: {cls.nextSession}
                </p>
                <a
                  href={`/dashboard/student/classes/${cls.id}`}
                  className="inline-block mt-2 text-sm text-blue-600 hover:underline"
                >
                  View Class
                </a>
              </div>
            ))}
            {classes.length === 0 && (
              <p className="text-sm text-gray-600">
                You are not enrolled in any classes.
              </p>
            )}
          </div>
        </section>
      </div>
    </StudentLayout>
  );
}

const ProtectedStudentDashboardHome = withAuthProtection(
  StudentDashboardHome,
  ["student"]
);

export default ProtectedStudentDashboardHome;

