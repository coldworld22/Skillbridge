// components/admin/RecentActivity.js
import { FaBookOpen, FaUserPlus, FaVideo, FaCheckCircle } from "react-icons/fa";

const activities = [
  {
    icon: <FaBookOpen />,
    message: "New tutorial submitted: React Mastery",
    timestamp: "2 hours ago",
    color: "text-indigo-500",
  },
  {
    icon: <FaVideo />,
    message: "Live class scheduled: JavaScript Bootcamp",
    timestamp: "3 hours ago",
    color: "text-yellow-500",
  },
  {
    icon: <FaUserPlus />,
    message: "New user registered: sarah.dev@example.com",
    timestamp: "4 hours ago",
    color: "text-green-500",
  },
  {
    icon: <FaCheckCircle />,
    message: "Instructor approved: Mohammed Saeed",
    timestamp: "Yesterday",
    color: "text-blue-500",
  },
];

export default function RecentActivity() {
  return (
    <div className="bg-white p-6 rounded-xl shadow mt-8">
      <h2 className="text-xl font-semibold mb-4">📰 Recent Activity</h2>
      <ul className="space-y-4">
        {activities.map((activity, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <span className={`text-xl ${activity.color}`}>{activity.icon}</span>
            <div>
              <p className="text-gray-800">{activity.message}</p>
              <p className="text-sm text-gray-500">{activity.timestamp}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
