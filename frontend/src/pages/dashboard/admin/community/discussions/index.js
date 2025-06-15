import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import {
  FaSearch,
  FaLock,
  FaTrash,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import {
  fetchDiscussions,
  lockDiscussionById,
  deleteDiscussionById,
} from "@/services/admin/communityService";


export default function AdminCommunityDiscussionsPage() {
  const [discussions, setDiscussions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchDiscussions();
        const formatted = (data || []).map((d) => ({
          id: d.id,
          title: d.title,
          user: d.user_id,
          replies: d.replies_count ?? 0,
          status: d.locked ? "locked" : "open",
        }));
        setDiscussions(formatted);
      } catch (err) {
        console.error("Failed to load discussions", err);
      }
    };
    load();
  }, []);

  const handleView = (discussion) => {
    window.location.href = `/dashboard/admin/community/discussions/${discussion.id}`;
  };

  const handleLock = async (discussion) => {
    try {
      await lockDiscussionById(discussion.id);
      setDiscussions((prev) =>
        prev.map((d) =>
          d.id === discussion.id ? { ...d, status: "locked" } : d
        )
      );
    } catch (err) {
      console.error("Failed to lock discussion", err);
    }
  };

  const handleDelete = async (discussion) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this discussion?"
    );
    if (!confirmed) return;
    try {
      await deleteDiscussionById(discussion.id);
      setDiscussions((prev) => prev.filter((d) => d.id !== discussion.id));
    } catch (err) {
      console.error("Failed to delete discussion", err);
    }
  };

  const filtered = discussions.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (statusFilter === "all" || d.status === statusFilter)
  );

  return (
    <AdminLayout title="Community Discussions">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">Manage Discussions</h1>
          <p className="text-gray-500 text-sm">Search, filter, and moderate all community questions.</p>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <FaSearch className="absolute top-3 right-3 text-gray-400" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-yellow-400"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="locked">Locked</option>
          </select>
        </div>

        {/* List */}
        <div className="space-y-4">
          {filtered.length > 0 ? (
            filtered.map((discussion) => (
              <div
                key={discussion.id}
                className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white border border-gray-200 rounded-lg px-4 py-4 shadow-sm hover:shadow-md transition"
              >
                <div className="mb-3 sm:mb-0">
                  <h2 className="text-lg font-semibold text-gray-800">{discussion.title}</h2>
                  <p className="text-sm text-gray-500">
                    By <strong>{discussion.user}</strong> • {discussion.replies} replies
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 ${
                      discussion.status === "open"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {discussion.status === "open" ? <FaCheckCircle /> : <FaTimesCircle />}
                    {discussion.status}
                  </span>
                  <button
                    onClick={() => handleView(discussion)}
                    className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded hover:bg-blue-200 flex items-center gap-2"
                  >
                    <FaEye /> View
                  </button>
                  {discussion.status !== "locked" && (
                    <button
                      onClick={() => handleLock(discussion)}
                      className="bg-yellow-100 text-yellow-700 text-sm px-3 py-1 rounded hover:bg-yellow-200 flex items-center gap-2"
                    >
                      <FaLock /> Lock
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(discussion)}
                    className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded hover:bg-red-200 flex items-center gap-2"
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No discussions match your search.</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
