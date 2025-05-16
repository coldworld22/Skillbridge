// components/admin/security/MessageFlagLog.js
import { useState } from "react";

const flaggedMessages = [
  {
    id: 1,
    user: "student_ayman",
    role: "Student",
    content: "This is stupid",
    time: "2025-04-14 10:42",
    status: "Flagged"
  },
  {
    id: 2,
    user: "instructor_maria",
    role: "Instructor",
    content: "That’s a dumb answer",
    time: "2025-04-14 10:46",
    status: "Pending Review"
  }
];

export default function MessageFlagLog() {
  const [search, setSearch] = useState("");

  const filteredMessages = flaggedMessages.filter((msg) =>
    msg.user.toLowerCase().includes(search.toLowerCase()) ||
    msg.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">🚨 Flagged Messages</h2>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search by user or message..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
      />

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-sm text-left">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Message</th>
              <th className="px-4 py-2">Time</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMessages.map((msg) => (
              <tr key={msg.id} className="border-b">
                <td className="px-4 py-2 font-medium text-gray-800">{msg.user}</td>
                <td className="px-4 py-2">{msg.role}</td>
                <td className="px-4 py-2 text-red-600">{msg.content}</td>
                <td className="px-4 py-2">{msg.time}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${msg.status === 'Flagged' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    {msg.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-right space-x-2">
                  <button className="text-green-600 hover:underline text-sm">Approve</button>
                  <button className="text-red-600 hover:underline text-sm">Delete</button>
                </td>
              </tr>
            ))}
            {filteredMessages.length === 0 && (
              <tr>
                <td colSpan="6" className="px-4 py-6 text-center text-gray-500">No results found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}