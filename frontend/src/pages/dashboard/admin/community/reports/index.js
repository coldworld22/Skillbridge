import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaExclamationCircle, FaTrash, FaEye } from "react-icons/fa";

const mockReports = [
  {
    id: 1,
    type: "discussion",
    reason: "Inappropriate language",
    content: "This is stupid!",
    user: "user123",
    discussionId: 5,
  },
  {
    id: 2,
    type: "reply",
    reason: "Spam / promotion",
    content: "Buy my course here: spamlink.com",
    user: "marketer99",
    discussionId: 2,
  },
];

export default function AdminCommunityReportsPage() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    setReports(mockReports);
  }, []);

  const handleReview = (report) => {
    window.open(`/dashboard/admin/community/discussions/${report.discussionId}`, "_blank");
  };

  const handleDelete = (reportId) => {
    const confirmDelete = confirm("Are you sure you want to delete this content?");
    if (confirmDelete) {
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    }
  };

  return (
    <AdminLayout title="Reported Posts">
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Reported Content</h1>

        <div className="space-y-4">
          {reports.length > 0 ? (
            reports.map((report) => (
              <div
                key={report.id}
                className="bg-white border-l-4 border-red-500 p-4 rounded shadow-sm hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-red-600 flex items-center gap-2">
                      <FaExclamationCircle /> {report.reason}
                    </h4>
                    <p className="text-sm text-gray-700 mt-2">"{report.content}"</p>
                    <p className="text-xs text-gray-500 mt-1">Reported by <strong>{report.user}</strong></p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleReview(report)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      <FaEye className="inline mr-1" /> Review
                    </button>
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      <FaTrash className="inline mr-1" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No reports at the moment.</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
