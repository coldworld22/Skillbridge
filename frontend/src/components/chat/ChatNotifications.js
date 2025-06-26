import { useEffect, useState } from "react";
import { FaEnvelopeOpenText, FaUsers, FaBell } from "react-icons/fa";
import { getNotifications } from "@/services/notificationService";
import formatRelativeTime from "@/utils/relativeTime";

const ChatNotifications = ({ users = [], groups = [], setSelectedChat, userId = 1 }) => {
  const [systemNotifs, setSystemNotifs] = useState([]);

  useEffect(() => {
    if (!userId) return;

    getNotifications(userId)
      .then(setSystemNotifs)
      .catch((err) => {
        console.error("Failed to load notifications:", err);
        // Fallback mock data (for testing)
        setSystemNotifs([
          {
            id: 1,
            message: "📢 Welcome to the chat system!",
            timestamp: new Date().toISOString(),
          },
          {
            id: 2,
            message: "🔔 Reminder: Your class starts at 4 PM.",
            timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          },
        ]);
      });
  }, [userId]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg text-white max-w-md w-full">
      <h3 className="text-lg font-bold text-yellow-500 flex items-center gap-2 mb-2">
        <FaBell /> Notifications Center
      </h3>

      {/* 🔔 System Alerts */}
      {systemNotifs.length > 0 && (
        <>
          <h4 className="text-yellow-400 font-semibold mt-4">System Alerts</h4>
          <ul className="space-y-2">
            {systemNotifs.map((n) => (
              <li key={n.id} className="bg-gray-700 p-3 rounded-lg border-l-4 border-yellow-500">
                <div className="text-sm">{n.message}</div>
                <div className="text-xs text-gray-400">{formatRelativeTime(n.timestamp)}</div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* 📩 Unread Direct Messages */}
      {users.length > 0 && (
        <>
          <h4 className="text-yellow-400 font-semibold mt-4">Users</h4>
          <ul className="space-y-2">
            {users.map((user) => (
              <li
                key={user.id}
                className="p-3 bg-gray-700 rounded-lg cursor-pointer flex items-center gap-3 hover:bg-gray-600 transition"
                onClick={() => setSelectedChat(user)}
              >
                <FaEnvelopeOpenText className="text-yellow-500" />
                {user.name}
                {user.unread > 0 && (
                  <span className="ml-auto bg-red-500 text-xs px-2 py-1 rounded-full">
                    {user.unread} new
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* 👥 Group Notifications */}
      {groups.length > 0 && (
        <>
          <h4 className="text-yellow-400 font-semibold mt-4">Groups</h4>
          <ul className="space-y-2">
            {groups.map((group) => (
              <li
                key={group.id}
                className="p-3 bg-gray-700 rounded-lg cursor-pointer flex items-center gap-3 hover:bg-gray-600 transition"
                onClick={() => setSelectedChat(group)}
              >
                <FaUsers className="text-yellow-500" />
                {group.name || group.groupName}
                {group.unread > 0 && (
                  <span className="ml-auto bg-red-500 text-xs px-2 py-1 rounded-full">
                    {group.unread} new
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* 💤 Fallback */}
      {users.length === 0 && groups.length === 0 && systemNotifs.length === 0 && (
        <p className="text-gray-400 mt-4 text-sm text-center">No new notifications right now.</p>
      )}
    </div>
  );
};

export default ChatNotifications;
