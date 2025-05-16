// components/admin/StatsGrid.js
import { FaUsers, FaDollarSign, FaChalkboardTeacher, FaBook, FaVideo, FaClipboardList,FaBookDead, FaBookOpen  } from 'react-icons/fa';

const stats = [
  { icon: <FaUsers />, label: "Total Users", value: 1240, color: "text-blue-500" },
  { icon: <FaUsers />, label: "Inactive Users", value: 1240, color: "text-red-500" },
  { icon: <FaDollarSign />, label: "Monthly Revenue", value: "$12,980", color: "text-green-500" },
  { icon: <FaChalkboardTeacher />, label: "Active Instructors", value: 87, color: "text-purple-500" },
  { icon: <FaBook />, label: "Published Tutorials", value: 321, color: "text-indigo-500" },
  { icon: <FaVideo />, label: "Upcoming Live Classes", value: 14, color: "text-yellow-500" },
  { icon: <FaVideo />, label: "Ongoing Live Classes", value: 3, color: "text-red-500" },
  { icon: <FaVideo />, label: "Pending Class Approvals", value: 5, color: "text-pink-500" },
  { icon: <FaBookOpen />, label: "Pending Tutorial Reviews", value: 12, color: "text-orange-500" },
  { icon: <FaBook />, label: "Published Tutorials", value: 321, color: "text-indigo-500" },
  { icon: <FaBookDead />, label: "Rejected Tutorials", value: 4, color: "text-red-500" },
  { icon: <FaClipboardList />, label: "Tutorial Enrollments", value: 7800, color: "text-blue-600" },

];



export default function StatsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-white p-6 rounded-xl shadow flex items-center gap-4">
          <div className={`${stat.color} text-3xl`}>{stat.icon}</div>

          <div>
            <p className="text-gray-500 text-sm">{stat.label}</p>
            <h3 className="text-xl font-bold">{stat.value}</h3>
          </div>
        </div>
      ))}
    </div>
  );
}
