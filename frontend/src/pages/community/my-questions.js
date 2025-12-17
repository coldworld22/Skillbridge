import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import Link from "next/link";
import { fetchDiscussions } from "@/services/communityService";
import useAuthStore from "@/store/auth/authStore";
import { safeParseTags } from "@/utils/community/tags";
import { toast } from "react-toastify";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../next-i18next.config.js";

const MyQuestions = () => {
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
          createdAt: q.created_at || q.date,
          tags: safeParseTags(q.tags),
          userId: q.user_id || null,
          userName: q.user_name || q.user?.name || "Anonymous",
        }));
        setQuestions(formatted);
      } catch (err) {
        console.error(err);
        toast.error("Unable to load your questions right now.");
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
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-yellow-400">My Questions</h1>
        <p className="mt-2 text-gray-300">
          Review your recent activity and jump back into conversations you started.
        </p>

        {!user ? (
          <p className="mt-8 text-gray-400">
            Please sign in to view the discussions you have created.
          </p>
        ) : loading ? (
          <p className="mt-8 text-gray-400">Loading your discussions…</p>
        ) : myQuestions.length === 0 ? (
          <p className="mt-8 text-gray-400">You haven’t posted any questions yet.</p>
        ) : (
          <ul className="mt-8 space-y-4">
            {myQuestions.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/community/question/${q.id}`}
                  className="block rounded-xl border border-gray-800 bg-gray-900 px-5 py-4 transition hover:border-yellow-400/60 hover:bg-gray-800"
                >
                  <h2 className="text-lg font-semibold text-white">{q.title}</h2>
                  <p className="mt-1 text-sm text-gray-400">
                    Asked on {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : "—"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {q.tags.map((tag) => (
                      <span key={tag} className="text-xs px-3 py-1 bg-yellow-500/20 text-yellow-200 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Footer />
    </div>
  );
};
export default MyQuestions;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"], nextI18NextConfig)),
    },
  };
}
