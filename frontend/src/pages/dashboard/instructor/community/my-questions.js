import { useEffect, useMemo, useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import Link from "next/link";
import { FaEye } from "react-icons/fa";
import { fetchDiscussions } from "@/services/communityService";
import useAuthStore from "@/store/auth/authStore";
import { safeParseTags } from "@/utils/community/tags";
import toast from "react-hot-toast";

export default function MyQuestionsPage() {
  const { user } = useAuthStore();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setQuestions([]);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const list = await fetchDiscussions();
        const formatted = (list || []).map((q) => ({
          id: q.id,
          title: q.title,
          tags: safeParseTags(q.tags),
          userId: q.user_id || null,
          userName: q.user_name || q.user?.name || "Anonymous",
          replies: typeof q.replies === "number" ? q.replies : Number(q.replies_count ?? 0),
        }));
        setQuestions(formatted);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load questions");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const myQuestions = useMemo(() => {
    if (!user) return [];
    const ownerName = user.full_name || user.name;
    return questions.filter((q) => {
      if (user.id && q.userId) return q.userId === user.id;
      return ownerName ? q.userName === ownerName : false;
    });
  }, [questions, user?.id, user?.full_name, user?.name]);

  return (
    <InstructorLayout title="My Questions">
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">🗂️ My Posted Questions</h1>

        {!user ? (
          <p className="text-gray-500">Sign in to view your community discussions.</p>
        ) : loading ? (
          <p className="text-gray-500">Loading your discussions…</p>
        ) : myQuestions.length === 0 ? (
          <p className="text-gray-500">You haven’t posted any questions yet.</p>
        ) : (
          <div className="space-y-4">
            {myQuestions.map((q) => (
              <div
                key={q.id}
                className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition"
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-1">{q.title}</h2>
                <p className="text-sm text-gray-500 mb-2">{q.replies} replies</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {q.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <Link href={`/dashboard/instructor/community/questions/${q.id}`}>
                  <button className="bg-blue-100 text-blue-700 px-4 py-2 rounded text-sm font-semibold flex items-center gap-2 hover:bg-blue-200">
                    <FaEye /> View Discussion
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}
