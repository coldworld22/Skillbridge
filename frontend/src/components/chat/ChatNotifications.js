import { useEffect, useState } from "react";
import { FaEnvelopeOpenText, FaUsers, FaBell } from "react-icons/fa";
import { toast } from "react-toastify";
import { getNotifications } from "@/services/notificationService";
import formatRelativeTime from "@/utils/relativeTime";
import LinkText from "@/components/shared/LinkText";
import { useTranslation } from "next-i18next";
import useNotificationStore from "@/store/notifications/notificationStore";

const ChatNotifications = ({ users = [], groups = [], setSelectedChat, userId = 1 }) => {
  const { t } = useTranslation("common");
  const [systemNotifs, setSystemNotifs] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);

  const markRead = useNotificationStore((s) => s.markRead);

  const handleMarkRead = async (id) => {
    const prev = systemNotifs;
    setSystemNotifs((p) => p.filter((n) => n.id !== id));
    const success = await markRead(id);
    if (success) {
      toast.success(t('mark_as_read'));
    } else {
      setSystemNotifs(prev);
      toast.error(t('mark_as_read_error', 'Failed to mark notification as read'));
    }
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
    <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-gray-900">
        <FaBell className="text-blue-500" /> {t("notifications_center")}
      </h3>

      {/* 🔔 System Alerts */}
      {systemNotifs.length > 0 && (
        <>
          <div className="mt-4 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700">{t("system_alerts")}</h4>
            <button
              className="text-xs font-medium text-blue-600 hover:text-blue-500"
              onClick={() => setShowAlerts((s) => !s)}
            >
              {showAlerts ? t("hide", "Hide") : t("show", "Show")}
            </button>
          </div>
          {showAlerts && (
            <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto pr-1">
              {systemNotifs.map((n) => (
                <li
                  key={n.id}
                  className="flex items-start justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
                >
                  <div>
                    <div className="text-sm text-gray-800">
                      <LinkText text={n.message} />
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatRelativeTime(n.timestamp)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="ml-2 rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white transition hover:bg-blue-500"
                  >
                    {t("mark_as_read")}
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
          <h4 className="mt-4 text-sm font-semibold text-gray-700">{t("users")}</h4>
          <ul className="space-y-2">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition hover:border-blue-200 hover:bg-blue-50"
                onClick={() => setSelectedChat(user)}
              >
                <FaEnvelopeOpenText className="text-blue-500" />
                <span className="text-sm font-medium text-gray-900">{user.name}</span>
                {user.unread > 0 && (
                  <span className="ml-auto rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-600">
                    {user.unread} {t("new")}
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
          <h4 className="mt-4 text-sm font-semibold text-gray-700">{t("groups")}</h4>
          <ul className="space-y-2">
            {groups.map((group) => (
              <li
                key={group.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition hover:border-blue-200 hover:bg-blue-50"
                onClick={() => setSelectedChat({ ...group, isGroup: true })}
              >
                <FaUsers className="text-purple-500" />
                <span className="text-sm font-medium text-gray-900">
                  {group.name || group.groupName}
                </span>
                {group.unread > 0 && (
                  <span className="ml-auto rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-600">
                    {group.unread} {t("new")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* 💤 Fallback */}
      {users.length === 0 && groups.length === 0 && systemNotifs.length === 0 && (
        <p className="mt-4 text-center text-sm text-gray-500">
          {t("no_new_notifications")}
        </p>
      )}
    </div>
  );
};

export default ChatNotifications;
