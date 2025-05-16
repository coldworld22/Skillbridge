import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaTrash } from "react-icons/fa";

const mockAnnouncements = [
  {
    id: 1,
    message: "🚀 Community v2 just launched! Check out the new features.",
    timestamp: "2025-05-10 09:30",
  },
  {
    id: 2,
    message: "🛠️ Scheduled maintenance on Sunday at 3AM GMT.",
    timestamp: "2025-05-08 14:22",
  },
];

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    setAnnouncements(mockAnnouncements);
  }, []);

  const handlePost = () => {
    if (!newMessage.trim()) return;
    const newEntry = {
      id: Date.now(),
      message: newMessage.trim(),
      timestamp: new Date().toLocaleString(),
    };
    setAnnouncements((prev) => [newEntry, ...prev]);
    setNewMessage("");
  };

  const handleDelete = (id) => {
    const confirmDelete = confirm("Delete this announcement?");
    if (confirmDelete) {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    }
  };

  return (
    <AdminLayout title="Community Announcements">
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Post Announcement</h1>

        {/* New Announcement Form */}
        <div className="mb-8">
          <textarea
            rows={3}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write something important to broadcast to all users..."
            className="w-full border border-gray-300 rounded px-4 py-2 mb-2 resize-none"
          />
          <button
            onClick={handlePost}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded font-semibold"
          >
            Post
          </button>
        </div>

        {/* Existing Announcements */}
        <div className="space-y-4">
          {announcements.length > 0 ? (
            announcements.map((a) => (
              <div
                key={a.id}
                className="bg-white border-l-4 border-yellow-500 p-4 rounded shadow-sm relative"
              >
                <p className="text-gray-800">{a.message}</p>
                <p className="text-sm text-gray-400 mt-1">{a.timestamp}</p>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="absolute top-3 right-3 text-red-500 hover:text-red-700"
                >
                  <FaTrash />
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No announcements posted yet.</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
