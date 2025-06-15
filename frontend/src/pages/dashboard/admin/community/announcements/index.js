import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaTrash } from "react-icons/fa";
import {
  fetchAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from "@/services/admin/communityService";

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAnnouncements();
        const formatted = (data || []).map((a) => ({
          id: a.id,
          message: a.message,
          timestamp: new Date(a.created_at).toLocaleString(),
        }));
        setAnnouncements(formatted);
      } catch (err) {
        console.error("Failed to load announcements", err);
      }
    };
    load();
  }, []);

  const handlePost = async () => {
    if (!newMessage.trim()) return;
    try {
      const payload = { title: newMessage.trim(), message: newMessage.trim() };
      const created = await createAnnouncement(payload);
      const newEntry = {
        id: created.id,
        message: created.message,
        timestamp: new Date(created.created_at).toLocaleString(),
      };
      setAnnouncements((prev) => [newEntry, ...prev]);
      setNewMessage("");
    } catch (err) {
      console.error("Failed to post announcement", err);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = confirm("Delete this announcement?");
    if (!confirmDelete) return;
    try {
      await deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to delete announcement", err);
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
