import { useState, useEffect } from "react";
import Link from "next/link";
import { FaUsers, FaCalendarAlt, FaChalkboardTeacher, FaLink, FaClock } from "react-icons/fa";
import InstructorLayout from '@/components/layouts/InstructorLayout';

const mockClasses = [
  {
    id: "react-bootcamp",
    title: "React & Next.js Bootcamp",
    startDate: "2025-05-13T10:00:00",
    endDate: "2025-06-10T10:00:00",
    duration: "4 weeks",
    students: 45,
    status: "Live",
    registrationLimit: 50,
    classLinkSent: true,
  },
  {
    id: "ui-design",
    title: "UI Design Fundamentals",
    startDate: "2025-06-01T14:00:00",
    endDate: "2025-07-01T14:00:00",
    duration: "1 month",
    students: 30,
    status: "Full",
    registrationLimit: 30,
    classLinkSent: false,
  },
  {
    id: "html-css",
    title: "HTML & CSS Basics",
    startDate: "2025-04-01T10:00:00",
    endDate: "2025-04-29T10:00:00",
    duration: "4 weeks",
    students: 60,
    status: "Completed",
    registrationLimit: 60,
    classLinkSent: true,
  },
];

export default function MyClasses() {
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setClasses(mockClasses);
  }, []);

  const filteredClasses = classes.filter((cls) =>
    cls.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendClassLink = (id) => {
    alert(`✅ Class link sent for: ${id}`);
    setClasses((prev) =>
      prev.map((cls) =>
        cls.id === id ? { ...cls, classLinkSent: true } : cls
      )
    );
  };

  return (
    <InstructorLayout>
      <div className="bg-white min-h-screen px-6 py-10 text-gray-900">
        <h1 className="text-2xl font-bold text-yellow-500 mb-6">📚 My Classes</h1>

        <input
          type="text"
          placeholder="Search classes..."
          className="mb-6 p-3 border border-gray-300 rounded w-full max-w-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => {
            const registrationStatus =
              cls.students >= cls.registrationLimit ? "Full" : "Open";

            return (
              <div key={cls.id} className="bg-gray-100 p-5 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <FaChalkboardTeacher className="text-yellow-500" /> {cls.title}
                </h2>
                <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                  <FaCalendarAlt /> {new Date(cls.startDate).toLocaleString()} - {new Date(cls.endDate).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                  <FaUsers /> {cls.students}/{cls.registrationLimit} students
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                  <FaClock /> Duration: {cls.duration}
                </p>
                <p className="text-xs text-gray-500 italic mb-1">
                  Registration: {registrationStatus}
                </p>
                <span
                  className={`inline-block px-3 py-1 text-sm rounded-full font-medium mb-4 ${
                    cls.status === "Live"
                      ? "bg-green-100 text-green-800"
                      : cls.status === "Upcoming"
                      ? "bg-yellow-100 text-yellow-800"
                      : cls.status === "Completed"
                      ? "bg-gray-200 text-gray-600"
                      : cls.status === "Full"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {cls.status}
                </span>
                <Link
                  href={`/dashboard/instructor/online-classe/${cls.id}`}
                  className="block bg-yellow-500 text-black text-center py-2 px-4 rounded hover:bg-yellow-600 font-semibold mb-2"
                >
                  Go to Class
                </Link>

                {cls.students >= cls.registrationLimit && !cls.classLinkSent && (
                  <button
                    onClick={() => handleSendClassLink(cls.id)}
                    className="bg-blue-500 text-white w-full py-2 px-4 rounded hover:bg-blue-600 text-sm flex items-center justify-center gap-2"
                  >
                    <FaLink /> Send Class Link
                  </button>
                )}

                {cls.classLinkSent && (
                  <div className="text-green-600 text-sm font-medium mt-2 text-center">
                    ✅ Class link sent to students
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredClasses.length === 0 && (
          <p className="text-center text-gray-500 mt-10">No classes found.</p>
        )}
      </div>
    </InstructorLayout>
  );
}