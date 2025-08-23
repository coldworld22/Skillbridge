// components/admin/security/MessageFlagLog.js
import { useEffect, useState } from "react";
import { fetchFlaggedMessages } from "@/services/admin/moderationService";

export default function MessageFlagLog() {
  const [flaggedMessages, setFlaggedMessages] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchFlaggedMessages();
        setFlaggedMessages(data);
      } catch (err) {
        console.error("Failed to load flagged messages", err);
      }
    }
    load();
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">🚨 Flagged Messages</h2>
      <div className="overflow-x-auto">
        {flaggedMessages.length === 0 ? (
          <p className="text-sm text-gray-600">No flagged messages.</p>
        ) : (
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
              {flaggedMessages.map((msg) => (
                <tr key={msg.id} className="border-b">
                  <td className="px-4 py-2 font-medium text-gray-800">{msg.user}</td>
                  <td className="px-4 py-2">{msg.role}</td>
                  <td className="px-4 py-2 text-red-600">{msg.content}</td>
                  <td className="px-4 py-2">{msg.time}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${msg.status === 'Flagged' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}
                    >
                      {msg.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button className="text-green-600 hover:underline text-sm">Approve</button>
                    <button className="text-red-600 hover:underline text-sm">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
