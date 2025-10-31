import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import InstructorLayout from '@/components/layouts/InstructorLayout';
import { FaReply, FaUserCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import {
  fetchDiscussionById,
  fetchReplies,
  createReply,
} from "@/services/communityService";
import ReactMarkdown from "react-markdown";
import { safeParseTags } from "@/utils/community/tags";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
};


export default function QuestionDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [question, setQuestion] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [replies, setReplies] = useState([]);
  const stats = useMemo(
    () => [
      { label: "Replies", value: replies.length },
      { label: "Tags", value: question?.tags?.length ?? 0 },
      { label: "Views", value: question?.views ?? 0 },
    ],
    [replies.length, question?.tags?.length, question?.views]
  );

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const q = await fetchDiscussionById(id);
        if (q) {
          setQuestion({
            ...q,
            tags: safeParseTags(q.tags),
          });
        }
        const r = await fetchReplies(id);
        setReplies(Array.isArray(r) ? r : []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [id]);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      const newReply = await createReply(id, { content: replyText });
      if (newReply) {
        setReplies((prev) => [...prev, newReply]);
      }
      toast.success("Reply posted");
      setSubmitted(true);
      setReplyText("");
      setTimeout(() => setSubmitted(false), 1500);
    } catch (err) {
      console.error(err);
      toast.error("Failed to post reply");
    }
  };

  if (!question) return <InstructorLayout title="Loading..."><div className="p-6">Loading...</div></InstructorLayout>;

  return (
    <InstructorLayout title={question.title}>
      <div className="px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">
          <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
            <div className="space-y-4 p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <h1 className="text-3xl font-bold md:text-4xl">{question.title}</h1>
                <span className="rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-yellow-200">
                  {formatDate(question.created_at)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200/80">
                {question.user_avatar ? (
                  <img src={question.user_avatar} alt="avatar" className="h-9 w-9 rounded-full border border-white/20 object-cover" />
                ) : (
                  <FaUserCircle className="text-2xl text-yellow-200/80" />
                )}
                <span className="font-semibold text-white">{question.user_name}</span>
                <span className="text-white/60">opened this thread</span>
              </div>
            </div>
            <div className="grid gap-4 border-t border-white/10 bg-white/5 px-8 py-6 text-sm sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-white/10 p-4 shadow-inner">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-200/70">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr),1fr]">
            <article className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm">
              <ReactMarkdown className="space-y-4 text-slate-700 leading-relaxed">
                {question.content || "No description provided."}
              </ReactMarkdown>
            </article>

            <aside className="space-y-5 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Tags</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {question.tags.length > 0 ? (
                    question.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-yellow-300/60 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                        #{tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">No tags provided.</span>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-800">Tip for mentors</p>
                <p className="mt-1">Pin insightful answers or add follow-up material to keep learners moving forward.</p>
              </div>
            </aside>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Replies</h2>
            {replies.length > 0 ? (
              replies.map((reply) => (
                <div key={reply.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    {reply.user_avatar ? (
                      <img src={reply.user_avatar} alt="avatar" className="h-8 w-8 rounded-full border border-slate-200 object-cover" />
                    ) : (
                      <FaUserCircle className="text-2xl text-slate-400" />
                    )}
                    <div>
                      <p className="font-semibold text-slate-800">{reply.user_name}</p>
                      <span>{formatDate(reply.created_at)}</span>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-slate-700">
                    <ReactMarkdown>{reply.content}</ReactMarkdown>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-8 text-center text-slate-500">
                No responses yet. Share your guidance to unblock learners.
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <h3 className="text-md font-semibold text-slate-900">Post a Reply</h3>
            <p className="mt-1 text-sm text-slate-500">Provide structured steps or reference material to help students resolve the issue.</p>
            <textarea
              rows={4}
              className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-300/60"
              placeholder="Write your reply here..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <button
              onClick={handleReply}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-yellow-500 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-yellow-400"
            >
              <FaReply /> Reply
            </button>

            {submitted && (
              <p className="mt-2 text-sm text-emerald-600">Reply submitted!</p>
            )}
          </section>
        </div>
      </div>
    </InstructorLayout>
  );
}
