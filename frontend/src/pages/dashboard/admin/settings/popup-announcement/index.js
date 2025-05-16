import AdminLayout from "@/components/layouts/AdminLayout";
import { FaPlus, FaEdit, FaTrash, FaEye, FaToggleOn, FaToggleOff } from "react-icons/fa";
import { useState } from "react";

const mockAnnouncements = [
  {
    id: 1,
    title: "🚧 Maintenance Tonight",
    status: true,
    audience: "All Visitors",
    pages: "All Pages",
    start: "2025-05-16 20:00",
    end: "2025-05-17 02:00",
  },
  {
    id: 2,
    title: "🎉 Promo for Students",
    status: false,
    audience: "Students Only",
    pages: "/courses",
    start: "2025-05-18 00:00",
    end: "2025-05-20 23:59",
  },
];

export default function PopupAnnouncementsIndex() {
  const [announcements, setAnnouncements] = useState(mockAnnouncements);

  const toggleStatus = (id) => {
    setAnnouncements((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: !a.status } : a
      )
    );
  };

  const deleteAnnouncement = (id) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
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
