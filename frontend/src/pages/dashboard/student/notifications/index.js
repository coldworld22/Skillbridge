import { useState, useEffect } from 'react';
import formatRelativeTime from '@/utils/relativeTime';
import StudentLayout from '@/components/layouts/StudentLayout';
import { FaBell, FaCalendarAlt, FaChalkboardTeacher, FaCheckCircle, FaTimes } from 'react-icons/fa';
import useNotificationStore from '@/store/notifications/notificationStore';
import LinkText from '@/components/shared/LinkText';

export default function StudentNotificationsPage() {
  const [filter, setFilter] = useState('all');
  const notifications = useNotificationStore((state) => state.items);
  const fetchNotifications = useNotificationStore((state) => state.fetch);
  const startPolling = useNotificationStore((state) => state.startPolling);
  const markRead = useNotificationStore((state) => state.markRead);

  useEffect(() => {
    fetchNotifications();
    startPolling();
  }, [fetchNotifications, startPolling]);

  const handleMarkRead = (id) => {
    markRead(id);
  };

  const handleMarkAllRead = () => {
    notifications.forEach((n) => {
      if (!n.read) markRead(n.id);
    });
  };

  const handleDelete = (id) => {
    // No backend endpoint for deletion; remove locally
    // Deleted notifications will automatically be cleaned up after an hour
    markRead(id);
  };

  const filtered = notifications.filter((n) =>
    filter === 'all' ? true : n.type === filter
  );

  return (
    <StudentLayout>
      <div className="min-h-screen p-6 bg-white text-gray-900">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-yellow-500">🔔 Notifications</h1>
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-blue-600 hover:underline"
          >
            Mark All as Read
          </button>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          {['all', 'class', 'assignment', 'announcement'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-sm ${
                filter === type
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <p className="text-gray-500 text-center mt-10">No notifications found.</p>
          ) : (
            filtered.map((note) => (
              <div
                key={note.id}
                className={`flex items-start justify-between p-4 border rounded-lg shadow-sm transition ${
                  note.read ? 'bg-gray-100' : 'bg-yellow-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-yellow-600 mt-1 text-lg">
                    {note.type === 'class' ? <FaChalkboardTeacher /> : note.type === 'assignment' ? <FaCheckCircle /> : <FaBell />}
                  </div>
                  <div>
                    <p className="text-sm mb-1 leading-relaxed font-medium"><LinkText text={note.message} /></p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <FaCalendarAlt /> {formatRelativeTime(note.date)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 items-start">
                  {!note.read && (
                    <button
                      onClick={() => handleMarkRead(note.id)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Mark as Read
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                    title="Delete"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
