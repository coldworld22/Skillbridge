import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaLock, FaTrash, FaArrowLeft, FaCheck, FaStar } from "react-icons/fa";
import { markAsResolved, lockDiscussion } from "@/utils/community/moderation";

const mockDiscussion = {
  id: 1,
  title: "How to set up React with Docker?",
  user: "John Doe",
  status: "open",
  replies: [
    { id: 1, user: "Instructor Sarah", text: "Use a Dockerfile with node:18 base.", timestamp: "2h ago" },
    { id: 2, user: "Jane", text: "Don't forget to expose port 3000!", timestamp: "1h ago" },
  ],
};

export default function AdminDiscussionDetailsPage() {
  const router = useRouter();
  const { id } = router.query;

  const [discussion, setDiscussion] = useState(null);

  useEffect(() => {
    // Simulate fetch by ID
    if (id) {
      setDiscussion({ ...mockDiscussion, id: Number(id) });
    }
  }, [id]);

  const handleLock = () => {
    setDiscussion((prev) => ({ ...prev, status: "locked" }));
    lockDiscussion(id);
  };

  const handleMarkResolved = () => {
    setDiscussion(markAsResolved(discussion));
  };

  const handleDelete = () => {
    const confirmed = confirm("Delete this discussion?");
    if (confirmed) router.push("/dashboard/admin/community/discussions");
  };

  if (!discussion) return <div className="p-6">Loading...</div>;

  return (
    <AdminLayout title="View Discussion">
      <div className="p-6 max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-black flex items-center mb-4">
          <FaArrowLeft className="mr-2" /> Back
        </button>

        <h1 className="text-2xl font-bold mb-1">{discussion.title}</h1>
        <p className="text-gray-600 mb-4">Posted by <strong>{discussion.user}</strong></p>

        {/* Status Indicator */}
        <span
          className={`inline-block px-3 py-1 text-sm rounded-full font-semibold mb-6 ${
            discussion.status === "locked"
              ? "bg-red-100 text-red-700"
              : discussion.status === "resolved"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {discussion.status}
        </span>

        {/* Admin Actions */}
        <div className="flex gap-4 mb-8">
          <button onClick={handleLock} className="bg-red-500 text-white px-4 py-2 rounded flex items-center gap-2">
            <FaLock /> Lock Thread
          </button>
          <button onClick={handleMarkResolved} className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2">
            <FaCheck /> Mark Resolved
          </button>
          <button onClick={handleDelete} className="bg-gray-800 text-white px-4 py-2 rounded flex items-center gap-2">
            <FaTrash /> Delete
          </button>
        </div>

        {/* Replies Section */}
        <div className="bg-white p-4 rounded shadow space-y-4">
          <h2 className="text-lg font-semibold mb-2">Replies</h2>
          {discussion.replies.length > 0 ? (
            discussion.replies.map((reply) => (
              <div key={reply.id} className="border-b pb-3">
                <p className="text-gray-800">{reply.text}</p>
                <p className="text-sm text-gray-500 mt-1">
                  — {reply.user} • {reply.timestamp}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No replies yet.</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
