// components/admin/ManagementShortcuts.js
import { FaBook, FaVideo, FaUserTie, FaUsers, FaCog, FaCreditCard } from "react-icons/fa";
import Link from "next/link";

const shortcuts = [
  { icon: <FaBook />, label: "Manage Tutorials", href: "/admin/tutorials", color: "bg-indigo-500" },
  { icon: <FaVideo />, label: "Manage Live Classes", href: "/admin/classes", color: "bg-yellow-500" },
  { icon: <FaUserTie />, label: "Manage Instructors", href: "/admin/instructors", color: "bg-green-500" },
  { icon: <FaUsers />, label: "Manage Users", href: "/admin/users", color: "bg-blue-500" },
  { icon: <FaCreditCard />, label: "Payment Settings", href: "/admin/payments", color: "bg-pink-500" },
  { icon: <FaCog />, label: "System Config", href: "/admin/settings", color: "bg-gray-700" },
];

export default function ManagementShortcuts() {
  return (
    <div className="bg-white p-6 rounded-xl shadow mt-8">
      <h2 className="text-xl font-semibold mb-4">🧭 Quick Management Shortcuts</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {shortcuts.map((item, idx) => (
          <Link href={item.href} key={idx}>
            <div className="flex items-center gap-4 bg-gray-50 hover:bg-gray-100 transition p-4 rounded-xl shadow-sm cursor-pointer">
              <div className={`text-white p-2 rounded-lg ${item.color}`}>
                {item.icon}
              </div>
              <span className="text-gray-800 font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
