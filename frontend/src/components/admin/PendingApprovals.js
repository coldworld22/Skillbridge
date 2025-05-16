// components/admin/PendingApprovals.js
import Link from "next/link";
import { FaBookOpen, FaVideo, FaUserCheck } from "react-icons/fa";

const items = [
  {
    label: "Tutorials Awaiting Review",
    count: 12,
    icon: <FaBookOpen />,
    href: "/admin/tutorials",
    color: "text-indigo-500",
  },
  {
    label: "Live Classes to Approve",
    count: 4,
    icon: <FaVideo />,
    href: "/admin/classes",
    color: "text-yellow-500",
  },
  {
    label: "Instructor Requests",
    count: 3,
    icon: <FaUserCheck />,
    href: "/admin/instructors",
    color: "text-green-500",
  },
];

export default function PendingApprovals() {
  return (
    <div className="bg-white p-6 rounded-xl shadow mt-8">
      <h2 className="text-xl font-semibold mb-4">🚦 Pending Admin Actions</h2>
      <ul className="space-y-4">
        {items.map((item, idx) => (
          <li key={idx}>
            <Link href={item.href}>
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className={`text-2xl ${item.color}`}>{item.icon}</span>
                  <span className="text-gray-700">{item.label}</span>
                </div>
                <span className="font-bold text-gray-800">{item.count}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
