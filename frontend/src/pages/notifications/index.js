import { useEffect } from "react";
import Navbar from "@/components/website/sections/Navbar";
import { motion, AnimatePresence } from "framer-motion"; // ✅ Smooth animations
import { FaCheckCircle, FaTimesCircle, FaClock, FaBell, FaTrash } from "react-icons/fa";
import useNotificationStore from "@/store/notifications/notificationStore";

const NotificationsPage = () => {
  const notifications = useNotificationStore((state) => state.items);
  const loading = useNotificationStore((state) => state.loading);
  const fetchNotifications = useNotificationStore((state) => state.fetch);
  const startPolling = useNotificationStore((state) => state.startPolling);
  const markRead = useNotificationStore((state) => state.markRead);

  useEffect(() => {
    fetchNotifications();
    startPolling();
  }, [fetchNotifications, startPolling]);

  const clearAllNotifications = () => {
    if (window.confirm("Are you sure you want to delete all notifications? 🚀")) {
      notifications.forEach((n) => !n.read && markRead(n.id));
    }
  };

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />
      <main className="pt-24 pb-12 container mx-auto px-6">
        <h1 className="text-3xl font-bold mb-6 text-center">🔔 Notifications</h1>

        {loading ? (
          <div className="text-center py-10">
            <p className="text-lg">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-10">
            <FaBell className="mx-auto text-6xl mb-4 text-yellow-500" />
            <p className="text-lg">No notifications yet.</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gray-900 shadow-md rounded-lg p-6"
          >
            {/* ✅ "Clear All" Button */}
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Recent Notifications</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={clearAllNotifications}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2"
              >
                <FaTrash /> Clear All
              </motion.button>
            </div>

            {/* ✅ Notifications List */}
            <ul className="space-y-6">
              <AnimatePresence>
                {notifications.map((notif) => (
                  <motion.li
                    key={notif.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className={`flex justify-between items-center border-b border-gray-700 pb-4 ${
                      notif.read ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {notif.type === "success" && <FaCheckCircle className="text-green-500" />}
                      {notif.type === "warning" && <FaClock className="text-yellow-500" />}
                      {notif.type === "info" && <FaBell className="text-blue-500" />}
                      <div>
                        <h3 className="text-lg">{notif.message}</h3>
                        <p className="text-gray-400 text-sm">{notif.time}</p>
                      </div>
                    </div>

                    {!notif.read && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => markRead(notif.id)}
                        className="px-3 py-1 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition font-bold"
                      >
                        Mark as Read
                      </motion.button>
                    )}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default NotificationsPage;
