import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import StudentLayout from "@/components/layouts/StudentLayout";
import { FaReply, FaUserCircle } from "react-icons/fa";
import { fetchDiscussionById, fetchReplies, createReply } from "@/services/communityService";
import toast, { Toaster } from "react-hot-toast";

export default function QuestionDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [question, setQuestion] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const q = await fetchDiscussionById(id);
        if (q) {
          q.tags = Array.isArray(q.tags)
            ? q.tags
            : typeof q.tags === "string" && q.tags
            ? JSON.parse(q.tags)
            : [];
          setQuestion(q);
        }
        const r = await fetchReplies(id);
        setReplies(r);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load discussion");
      }
    };
    load();
  }, [id]);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    const fd = new FormData();
    fd.append("content", replyText);
    try {
      const newReply = await createReply(id, fd);
      setReplies((prev) => [...prev, newReply]);
      setReplyText("")
      toast.success("Reply posted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to post reply");
    } finally {
      setSubmitting(false);
    }
  };

  if (!question) return <StudentLayout title="Loading..."><div className="p-6">Loading...</div></StudentLayout>;

  return (
    <StudentLayout title={question.title}>
      <Toaster position="top-center" />
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        {/* Question */}
        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-2 text-gray-800">{question.title}</h1>
        <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
          {question.user_avatar ? (
            <img src={question.user_avatar} alt="avatar" className="w-6 h-6 rounded-full" />
          ) : (
            <FaUserCircle className="text-gray-400" />
          )}
          <span>Asked by <strong>{question.user_name}</strong></span>
        </p>
          <p className="text-gray-700 mb-4">{question.content}</p>
          <div className="flex gap-2 flex-wrap">
            {question.tags.map((tag) => (
              <span key={tag} className="text-xs px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Replies */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Replies</h2>
          {replies.map((reply) => (
            <div key={reply.id} className="bg-gray-50 border border-gray-200 p-4 rounded-lg flex gap-3">
              {reply.user_avatar ? (
                <img src={reply.user_avatar} alt="avatar" className="w-8 h-8 rounded-full" />
              ) : (
                <FaUserCircle className="text-3xl text-gray-400" />
              )}
              <div>
                <p className="text-sm font-semibold text-gray-800">{reply.user_name}</p>
                <p className="text-gray-600 text-sm">{reply.content}</p>
                <span className="text-xs text-gray-400">{new Date(reply.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Reply Box */}
        <div className="mt-6">
          <h3 className="text-md font-semibold mb-2 text-gray-800">Post a Reply</h3>
          <textarea
            rows={4}
            className="w-full border border-gray-300 rounded-lg p-3 resize-none focus:ring-yellow-400"
            placeholder="Write your reply here..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <button
            onClick={handleReply}
            disabled={submitting}
            className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            <FaReply /> {submitting ? 'Posting...' : 'Reply'}
          </button>
        </div>
      </div>
    </StudentLayout>
  );
}
