import { useEffect, useState } from "react";
import { FaEnvelopeOpenText, FaUsers, FaBell } from "react-icons/fa";
import { toast } from "react-toastify";
import { getNotifications } from "@/services/notificationService";
import formatRelativeTime from "@/utils/relativeTime";
import LinkText from "@/components/shared/LinkText";
import { useTranslation } from "next-i18next";
import useNotificationStore from "@/store/notifications/notificationStore";
import styles from "./ChatNotifications.module.scss";

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
    <div className={styles.container}>
      <h3 className={styles.titleRow}>
        <FaBell className={styles.iconBlue} /> {t("notifications_center")}
      </h3>

      {/* 🔔 System Alerts */}
      {systemNotifs.length > 0 && (
        <>
          <div className={styles.sectionHeader}>
            <h4>{t("system_alerts")}</h4>
            <button
              className={styles.toggle}
              onClick={() => setShowAlerts((s) => !s)}
              type="button"
            >
              {showAlerts ? t("hide", "Hide") : t("show", "Show")}
            </button>
          </div>
          {showAlerts && (
            <ul className={styles.alertList}>
              {systemNotifs.map((n) => (
                <li
                  key={n.id}
                  className={styles.alertItem}
                >
                  <div>
                    <div className={styles.alertMessage}>
                      <LinkText text={n.message} />
                    </div>
                    <div className={styles.alertMeta}>
                      {formatRelativeTime(n.timestamp)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className={styles.markRead}
                    type="button"
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
          <h4 className={styles.sectionTitle}>{t("users")}</h4>
          <ul className={styles.list}>
            {users.map((user) => (
              <li
                key={user.id}
                className={styles.listItem}
                onClick={() => setSelectedChat(user)}
              >
                <FaEnvelopeOpenText className={styles.iconBlue} />
                <span className={styles.listTitle}>{user.name}</span>
                {user.unread > 0 && (
                  <span className={styles.badge}>
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
          <h4 className={styles.sectionTitle}>{t("groups")}</h4>
          <ul className={styles.list}>
            {groups.map((group) => (
              <li
                key={group.id}
                className={styles.listItem}
                onClick={() => setSelectedChat({ ...group, isGroup: true })}
              >
                <FaUsers className={styles.iconPurple} />
                <span className={styles.listTitle}>
                  {group.name || group.groupName}
                </span>
                {group.unread > 0 && (
                  <span className={`${styles.badge} ${styles.badgePurple}`}>
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
        <p className={styles.empty}>
          {t("no_new_notifications")}
        </p>
      )}
    </div>
  );
};

export default ChatNotifications;
