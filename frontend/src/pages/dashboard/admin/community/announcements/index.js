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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [audience, setAudience] = useState("all");
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAnnouncements();
        const formatted = (data || []).map((a) => ({
          id: a.id,
          message: a.message,
          timestamp: new Date(a.created_at).toLocaleString(),
          startDate: a.start_date ? new Date(a.start_date).toLocaleString() : null,
          endDate: a.end_date ? new Date(a.end_date).toLocaleString() : null,
          audience: a.audience,
          pinned: a.pinned,
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

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      alert("Start date must be before end date");
      return;
    }

    try {
      const payload = {
        title: newMessage.trim(),
        message: newMessage.trim(),
        start_date: startDate || null,
        end_date: endDate || null,
        audience,
        pinned,
      };
      const created = await createAnnouncement(payload);
      const newEntry = {
        id: created.id,
        message: created.message,
        timestamp: new Date(created.created_at).toLocaleString(),
        startDate: created.start_date ? new Date(created.start_date).toLocaleString() : null,
        endDate: created.end_date ? new Date(created.end_date).toLocaleString() : null,
        audience: created.audience,
        pinned: created.pinned,
      };
      setAnnouncements((prev) => [newEntry, ...prev]);
      setNewMessage("");
      setStartDate("");
      setEndDate("");
      setAudience("all");
      setPinned(false);
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
        <div className="mb-8 space-y-4">
          <textarea
            rows={3}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write something important to broadcast to all users..."
            className="w-full border border-gray-300 rounded px-4 py-2 resize-none"
          />
          <div className="flex flex-wrap gap-4">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
              placeholder="Start date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
              placeholder="End date"
            />
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="all">All Users</option>
              <option value="student">Students</option>
              <option value="instructor">Instructors</option>
            </select>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
              />
              <span>Pinned</span>
            </label>
          </div>
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
                <div className="text-sm text-gray-400 mt-1 space-y-1">
                  <p>{a.timestamp}</p>
                  {(a.startDate || a.endDate) && (
                    <p>
                      Schedule: {a.startDate || "—"} - {a.endDate || "—"}
                    </p>
                  )}
                  {a.audience && <p>Audience: {a.audience}</p>}
                  {a.pinned && (
                    <p className="text-yellow-600 font-semibold">Pinned</p>
                  )}
                </div>
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
