import AdminLayout from "@/components/layouts/AdminLayout";
import { FaPlus, FaEdit, FaTrash, FaEye, FaToggleOn, FaToggleOff } from "react-icons/fa";
import { useState, useEffect } from "react";
import {
  fetchPopupAnnouncements,
  updatePopupAnnouncement,
  deletePopupAnnouncement,
} from "@/services/admin/popupAnnouncementService";

export default function PopupAnnouncementsIndex() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchPopupAnnouncements();
        const formatted = (data || []).map((a) => ({
          ...a,
          status: a.active,
          audience: a.audience,
          pages: Array.isArray(a.pages) ? a.pages.join(', ') : a.pages,
          start: a.start_date,
          end: a.end_date,
        }));
        setAnnouncements(formatted);
      } catch (err) {
        console.error('Failed to load announcements', err);
      }
    };
    load();
  }, []);

  const toggleStatus = async (id) => {
    const ann = announcements.find((a) => a.id === id);
    if (!ann) return;
    try {
      const updated = await updatePopupAnnouncement(id, { active: !ann.status });
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: updated.active } : a))
      );
    } catch (err) {
      console.error('Failed to update', err);
    }
  };

  const deleteAnnouncement = async (id) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      try {
        await deletePopupAnnouncement(id);
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      } catch (err) {
        console.error('Failed to delete', err);
      }
    }
  };

  return (
    <AdminLayout title="Popup Announcements">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📢 Popup Announcements</h1>
        <a
          href="/dashboard/admin/settings/popup-announcement/create"
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded shadow flex items-center gap-2"
        >
          <FaPlus /> Add New
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Audience</th>
              <th className="p-3 text-left">Pages</th>
              <th className="p-3 text-left">Schedule</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {announcements.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-3">{a.title}</td>
                <td className="p-3">{a.audience}</td>
                <td className="p-3">{a.pages}</td>
                <td className="p-3 text-sm text-gray-600">
                  {a.start} → {a.end}
                </td>
                <td className="p-3 text-center">
                  <button onClick={() => toggleStatus(a.id)}>
                    {a.status ? (
                      <FaToggleOn className="text-green-500 text-xl" />
                    ) : (
                      <FaToggleOff className="text-gray-400 text-xl" />
                    )}
                  </button>
                </td>
                <td className="p-3 text-center flex justify-center gap-3">
                  <button title="Preview">
                    <FaEye className="text-blue-500" />
                  </button>
                  <a href={`/dashboard/admin/announcements/edit/${a.id}`}>
                    <FaEdit className="text-yellow-500" />
                  </a>
                  <button onClick={() => deleteAnnouncement(a.id)} title="Delete">
                    <FaTrash className="text-red-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
