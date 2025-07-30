import { useEffect, useState } from "react";
import InstructorLayout from '@/components/layouts/InstructorLayout';
import Link from "next/link";
import { FaEye } from "react-icons/fa";
import { fetchDiscussions } from "@/services/communityService";
import useAuthStore from "@/store/auth/authStore";

export default function MyQuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const { user } = useAuthStore();

  useEffect(() => {
    const load = async () => {
      try {
        const list = await fetchDiscussions();
        const normalized = (list || []).map((q) => ({
          ...q,
          tags: Array.isArray(q.tags)
            ? q.tags
            : typeof q.tags === "string" && q.tags
            ? JSON.parse(q.tags)
            : [],
        }));
        if (user) {
          setQuestions(
            normalized.filter((q) => q.user_name === user.full_name)
          );
        }
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [user]);

  return (
    <InstructorLayout title="My Questions">
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">🗂️ My Posted Questions</h1>

        {questions.length === 0 ? (
          <p className="text-gray-500">You haven’t posted any questions yet.</p>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => (
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
