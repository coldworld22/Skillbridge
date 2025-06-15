import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaLock, FaTrash, FaArrowLeft, FaCheck, FaStar } from "react-icons/fa";
import { markAsResolved } from "@/utils/community/moderation";
import {
  fetchDiscussionById,
  lockDiscussionById,
  deleteDiscussionById,
} from "@/services/admin/communityService";


export default function AdminDiscussionDetailsPage() {
  const router = useRouter();
  const { id } = router.query;

  const [discussion, setDiscussion] = useState(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await fetchDiscussionById(id);
        if (data) {
          setDiscussion({
            id: data.id,
            title: data.title,
            user: data.user_id,
            status: data.locked ? "locked" : data.resolved ? "resolved" : "open",
            replies: data.replies || [],
            content: data.content,
          });
        }
      } catch (err) {
        console.error("Failed to load discussion", err);
      }
    };
    load();
  }, [id]);

  const handleLock = async () => {
    try {
      await lockDiscussionById(id);
      setDiscussion((prev) => ({ ...prev, status: "locked" }));
    } catch (err) {
      console.error("Failed to lock discussion", err);
    }
  };

  const handleMarkResolved = () => {
    setDiscussion(markAsResolved(discussion));
  };

  const handleDelete = async () => {
    const confirmed = confirm("Delete this discussion?");
    if (!confirmed) return;
    try {
      await deleteDiscussionById(id);
      router.push("/dashboard/admin/community/discussions");
    } catch (err) {
      console.error("Failed to delete discussion", err);
    }
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

        {discussion.content && (
          <div className="bg-white p-4 rounded shadow space-y-4 mb-6">
            <p className="text-gray-800 whitespace-pre-line">{discussion.content}</p>
          </div>
        )}

        {/* Replies Section */}
        <div className="bg-white p-4 rounded shadow space-y-4">
          <h2 className="text-lg font-semibold mb-2">Replies</h2>
          {Array.isArray(discussion.replies) && discussion.replies.length > 0 ? (
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
