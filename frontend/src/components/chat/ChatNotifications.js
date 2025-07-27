import { useEffect, useState } from "react";
import { FaEnvelopeOpenText, FaUsers, FaBell } from "react-icons/fa";
import { toast } from "react-toastify";
import { getNotifications, markNotificationAsRead } from "@/services/notificationService";
import formatRelativeTime from "@/utils/relativeTime";
import LinkText from "@/components/shared/LinkText";
import { useTranslation } from "next-i18next";

const ChatNotifications = ({ users = [], groups = [], setSelectedChat, userId = 1 }) => {
  const { t } = useTranslation("common");
  const [systemNotifs, setSystemNotifs] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      toast.success(t('mark_as_read'));
    } catch (_) {}
    setSystemNotifs((prev) => prev.filter((n) => n.id !== id));
  };

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
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg text-white max-w-md w-full border border-yellow-600">
      <h3 className="text-lg font-bold text-yellow-500 flex items-center gap-2 mb-2">
        <FaBell /> {t('notifications_center')}
      </h3>

      {/* 🔔 System Alerts */}
      {systemNotifs.length > 0 && (
        <>
          <div className="flex justify-between items-center mt-4">
            <h4 className="text-yellow-400 font-semibold">{t('system_alerts')}</h4>
            <button
              className="text-xs text-blue-400 hover:underline"
              onClick={() => setShowAlerts((s) => !s)}
            >
              {showAlerts ? t('hide', 'Hide') : t('show', 'Show')}
            </button>
          </div>
          {showAlerts && (
            <ul className="space-y-2 max-h-40 overflow-y-auto mt-2 pr-1">
              {systemNotifs.map((n) => (
                <li
                  key={n.id}
                  className="bg-gray-700 p-3 rounded-lg border-l-4 border-yellow-500 flex justify-between items-start"
                >
                  <div>
                    <div className="text-sm">
                      <LinkText text={n.message} />
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatRelativeTime(n.timestamp)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                  >
                    {t('mark_as_read')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* 📩 Unread Direct Messages */}
      {users.length > 0 && (
        <>
          <h4 className="text-yellow-400 font-semibold mt-4">{t('users')}</h4>
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
                    {user.unread} {t('new')}
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
          <h4 className="text-yellow-400 font-semibold mt-4">{t('groups')}</h4>
          <ul className="space-y-2">
            {groups.map((group) => (
              <li
                key={group.id}
                className="p-3 bg-gray-700 rounded-lg cursor-pointer flex items-center gap-3 hover:bg-gray-600 transition"
                onClick={() => setSelectedChat({ ...group, isGroup: true })}
              >
                <FaUsers className="text-yellow-500" />
                {group.name || group.groupName}
                {group.unread > 0 && (
                  <span className="ml-auto bg-red-500 text-xs px-2 py-1 rounded-full">
                    {group.unread} {t('new')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* 💤 Fallback */}
      {users.length === 0 && groups.length === 0 && systemNotifs.length === 0 && (
        <p className="text-gray-400 mt-4 text-sm text-center">{t('no_new_notifications')}</p>
      )}
    </div>
  );
};

export default ChatNotifications;
