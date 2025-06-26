import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaClock,
  FaVideo,
} from "react-icons/fa";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { fetchInstructorClasses } from "@/services/instructor/classService";
import useAuthStore from "@/store/auth/authStore";

export default function MyClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSchedule, setFilterSchedule] = useState("All");
  const [filterApproval, setFilterApproval] = useState("All");

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchInstructorClasses();
        setClasses(data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load classes");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const myClasses = classes.filter((cls) => {
    if (cls.instructor_id && user?.id) return cls.instructor_id === user.id;
    if (cls.instructor && (user?.full_name || user?.name)) {
      const name = user.full_name || user.name;
      return cls.instructor === name;
    }
    return true;
  });

  const filteredClasses = myClasses
    .filter((cls) =>
      cls.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((cls) =>
      filterSchedule === "All" ? true : cls.scheduleStatus === filterSchedule
    )
    .filter((cls) =>
      filterApproval === "All" ? true : cls.approvalStatus === filterApproval
    );

  if (loading) {
    return (
      <InstructorLayout>
        <div className="p-6">Loading classes...</div>
      </InstructorLayout>
    );
  }

  if (error) {
    return (
      <InstructorLayout>
        <div className="p-6 text-red-500">{error}</div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout>
      <div className="bg-white min-h-screen px-6 py-10 text-gray-900">
        <h1 className="text-2xl font-bold text-yellow-500 mb-6">📚 My Classes</h1>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search classes..."
            className="p-3 border border-gray-300 rounded w-full sm:max-w-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="p-3 border border-gray-300 rounded w-full sm:w-auto"
            value={filterSchedule}
            onChange={(e) => setFilterSchedule(e.target.value)}
          >
            <option value="All">All Schedule</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
          </select>
          <select
            className="p-3 border border-gray-300 rounded w-full sm:w-auto"
            value={filterApproval}
            onChange={(e) => setFilterApproval(e.target.value)}
          >
            <option value="All">All Approval</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => (
            <div key={cls.id} className="bg-gray-100 p-5 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <FaChalkboardTeacher className="text-yellow-500" /> {cls.title}
              </h2>
              <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                <FaCalendarAlt />
                {cls.start_date || "-"}
                {cls.end_date ? ` - ${cls.end_date}` : ""}
              </p>
              <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                <FaClock /> Schedule: {cls.scheduleStatus}
              </p>
              {typeof cls.price !== "undefined" && (
                <p className="text-sm text-gray-600 mb-1">💵 Price: ${cls.price ?? 0}</p>
              )}
              {typeof cls.max_students !== "undefined" && (
                <p className="text-sm text-gray-600 mb-1">👥 Max Students: {cls.max_students}</p>
              )}
              <div className="flex gap-2 mb-4 mt-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    cls.status === "published"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {cls.status === "published" ? "Published" : "Draft"}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    cls.approvalStatus === "Approved"
                      ? "bg-green-100 text-green-800"
                      : cls.approvalStatus === "Rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {cls.approvalStatus}
                </span>
              </div>
              <Link
                href={`/dashboard/instructor/online-classes/${cls.id}`}
                className="block bg-yellow-500 text-black text-center py-2 px-4 rounded hover:bg-yellow-600 font-semibold flex items-center justify-center gap-2"
              >
                {cls.scheduleStatus === 'Ongoing' ? (
                  <>
                    <FaVideo /> Go To Class
                  </>
                ) : (
                  'Manage Class'
                )}
              </Link>
              <Link
                href={`/dashboard/instructor/online-classes/${cls.id}/details`}
                className="block bg-blue-500 text-white text-center py-2 px-4 rounded hover:bg-blue-600 font-semibold mt-2"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>

        {filteredClasses.length === 0 && (
          <p className="text-center text-gray-500 mt-10">No classes found.</p>
        )}
      </div>
    </InstructorLayout>
  );
}