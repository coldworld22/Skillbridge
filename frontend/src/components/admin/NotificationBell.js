import { useState } from "react";
import { FaBell } from "react-icons/fa";
import Link from "next/link";

const notifications = [
  { id: 1, message: "3 tutorials awaiting approval", link: "/admin/tutorials" },
  { id: 2, message: "New instructor request from Ayman", link: "/admin/instructors" },
  { id: 3, message: "Live class 'Java Basics' scheduled", link: "/admin/classes" },
];

export default function NotificationBell() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setOpen(!open)}
        className="relative text-gray-600 hover:text-yellow-500 focus:outline-none"
      >
        <FaBell className="text-xl" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-100">
          <div className="p-4 font-semibold text-gray-800 border-b">Notifications</div>
          <ul className="max-h-60 overflow-y-auto divide-y divide-gray-100">
            {notifications.map((note) => (
              <li key={note.id}>
                <Link
                  href={note.link}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {note.message}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
