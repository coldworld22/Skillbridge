import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import InstructorLayout from '@/components/layouts/InstructorLayout';
import { FaReply, FaUserCircle } from "react-icons/fa";

const mockQuestions = {
  1: {
    id: 1,
    title: "How do I integrate Tailwind with Next.js?",
    description: "I'm building a frontend using Next.js. How do I properly use Tailwind CSS with it?",
    user: "Ali",
    tags: ["Next.js", "Tailwind"],
    replies: [
      { id: 1, author: "Fatima", content: "Install Tailwind via npm and add to your config files.", timestamp: "1 hour ago" },
      { id: 2, author: "Omar", content: "Check the Tailwind docs — they have a great Next.js guide.", timestamp: "30 mins ago" },
    ],
  },
};

export default function QuestionDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [question, setQuestion] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (id && mockQuestions[id]) {
      setQuestion(mockQuestions[id]);
    }
  }, [id]);

  const handleReply = () => {
    if (!replyText.trim()) return;
    alert("Reply submitted (mock)");
    setSubmitted(true);
    setReplyText("");
    setTimeout(() => setSubmitted(false), 1500);
  };

  if (!question) return <InstructorLayout title="Loading..."><div className="p-6">Loading...</div></InstructorLayout>;

  return (
    <InstructorLayout title={question.title}>
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        {/* Question */}
        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-2 text-gray-800">{question.title}</h1>
          <p className="text-sm text-gray-500 mb-2">Asked by <strong>{question.user}</strong></p>
          <p className="text-gray-700 mb-4">{question.description}</p>
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
          {question.replies.map((reply) => (
            <div key={reply.id} className="bg-gray-50 border border-gray-200 p-4 rounded-lg flex gap-3">
              <FaUserCircle className="text-3xl text-gray-400" />
              <div>
                <p className="text-sm font-semibold text-gray-800">{reply.author}</p>
                <p className="text-gray-600 text-sm">{reply.content}</p>
                <span className="text-xs text-gray-400">{reply.timestamp}</span>
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
            className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-lg font-semibold flex items-center gap-2"
          >
            <FaReply /> Reply
          </button>

          {submitted && (
            <p className="text-green-600 text-sm mt-2">✅ Reply submitted!</p>
          )}
        </div>
      </div>
    </InstructorLayout>
  );
}
