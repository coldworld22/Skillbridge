// pages/dashboard/student/community/index.js
import { useEffect, useMemo, useState } from "react";
import StudentLayout from "@/components/layouts/StudentLayout";
import Link from "next/link";
import { FaSearch, FaPlus } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import { fetchDiscussions } from "@/services/communityService";
import useAuthStore from "@/store/auth/authStore";
import { safeParseTags } from "@/utils/community/tags";

const ITEMS_PER_PAGE = 5;

const buildExcerpt = (content) => {
  if (!content) return "";
  const stripped = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!stripped) return "";
  return stripped.length > 160 ? `${stripped.slice(0, 160).trim()}…` : stripped;
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
};

export default function StudentCommunityPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activeTag, setActiveTag] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [allDiscussions, setAllDiscussions] = useState([]);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await fetchDiscussions();
        const formatted = (list || []).map((d) => {
          const normalizedTags = safeParseTags(d.tags);
          const repliesRaw =
            typeof d.replies === "number"
              ? d.replies
              : Number(d.replies_count ?? d.answers_count ?? 0);
          const content = d.content || d.description || "";
          return {
            id: d.id,
            title: d.title,
            user: d.user_name || d.user?.name || "Anonymous",
            ownerId: d.user_id || null,
            tags: normalizedTags,
            replies: Number.isFinite(repliesRaw) ? repliesRaw : 0,
            createdAt: d.created_at || null,
            excerpt: buildExcerpt(content),
          };
        });
        setAllDiscussions(formatted);
        const tagSet = new Set();
        formatted.forEach((q) => q.tags.forEach((t) => tagSet.add(t)));
        setTags(Array.from(tagSet).sort((a, b) => a.localeCompare(b)));
      } catch (err) {
        console.error(err);
        toast.error("Failed to load discussions");
      }
    };
    load();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTag, activeTab]);

  const myQuestionsCount = useMemo(() => {
    if (!user) return 0;
    const ownerName = user.full_name || user.name;
    return allDiscussions.filter((d) => {
      if (user.id && d.ownerId) return d.ownerId === user.id;
      return ownerName ? d.user === ownerName : false;
    }).length;
  }, [allDiscussions, user?.full_name, user?.id, user?.name]);

  const discussions = useMemo(() => {
    if (activeTab !== "mine") return allDiscussions;
    if (!user) return [];
    const ownerName = user.full_name || user.name;
    return allDiscussions.filter((d) => {
      if (user.id && d.ownerId) return d.ownerId === user.id;
      return ownerName ? d.user === ownerName : false;
    });
  }, [activeTab, allDiscussions, user?.full_name, user?.id, user?.name]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return discussions.filter((d) => {
      const matchesQuery =
        !query ||
        d.title.toLowerCase().includes(query) ||
        d.excerpt.toLowerCase().includes(query) ||
        d.tags.some((tag) => tag.toLowerCase().includes(query));

      if (!matchesQuery) return false;

      if (activeTag) {
        return d.tags.some((tag) => tag.toLowerCase() === activeTag.toLowerCase());
      }

      return true;
    });
  }, [discussions, searchQuery, activeTag]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const totalCount = allDiscussions.length;
  const tagCount = tags.length;
  const stats = useMemo(
    () => [
      { label: "Total Threads", value: totalCount },
      { label: "Your Questions", value: myQuestionsCount },
      { label: "Active Tags", value: tagCount },
    ],
    [totalCount, myQuestionsCount, tagCount]
  );

  const hasActiveFilters = searchQuery.trim().length > 0 || Boolean(activeTag);

  return (
    <StudentLayout title="Community">
      <Toaster position="top-center" />
      <div className="px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-10">
          <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
            <div className="flex flex-col gap-8 p-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl space-y-4">
                <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-yellow-200">
                  Student Community Hub
                </span>
                <h1 className="text-3xl font-bold md:text-4xl">Share, learn, and grow together</h1>
                <p className="text-sm text-slate-200/80">
                  Explore answers from classmates, keep track of your own questions, and collaborate on challenges in real time.
                </p>
              </div>
              <Link href="/dashboard/student/community/ask" className="shrink-0">
                <span className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-6 py-2.5 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-yellow-300">
                  <FaPlus /> Ask the community
                </span>
              </Link>
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

          <section className="grid gap-6 lg:grid-cols-[280px,1fr]">
            <aside className="space-y-6 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">View</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    { key: "all", label: "All" },
                    { key: "mine", label: "My Posts" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setActiveTab(tab.key);
                        setCurrentPage(1);
                      }}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        activeTab === tab.key
                          ? "bg-slate-900 text-white shadow"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-500" htmlFor="community-search">
                  Search
                </label>
                <div className="relative mt-2">
                  <input
                    id="community-search"
                    type="text"
                    placeholder="Search by keyword or tag..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-300/60"
                  />
                  <FaSearch className="absolute right-3 top-3.5 text-slate-400" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Tags</p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTag("");
                        setSearchQuery("");
                      }}
                      className="text-xs font-semibold text-slate-500 transition hover:text-slate-700"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.length === 0 ? (
                    <span className="text-sm text-slate-400">No tags yet.</span>
                  ) : (
                    tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setActiveTag(tag === activeTag ? "" : tag);
                          setCurrentPage(1);
                        }}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                          tag === activeTag
                            ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                            : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        #{tag}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </aside>

            <div className="space-y-4">
              {paginated.length > 0 ? (
                paginated.map((d) => (
                  <Link key={d.id} href={`/dashboard/student/community/questions/${d.id}`}>
                    <article className="group rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-yellow-400/60 hover:shadow-lg">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-lg font-semibold text-slate-900 transition group-hover:text-yellow-600">
                          {d.title}
                        </h3>
                        <span className="text-xs font-medium text-slate-500">{formatDate(d.createdAt)}</span>
                      </div>
                      {d.excerpt && (
                        <p className="mt-3 text-sm text-slate-600">{d.excerpt}</p>
                      )}
                      <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700">
                            {activeTab === "mine" ? "You" : d.user}
                          </span>
                          <span>• {d.replies} replies</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {d.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className={`rounded-full border px-3 py-1 text-[11px] font-medium transition ${
                                activeTag === tag
                                  ? "border-yellow-300 bg-yellow-50 text-yellow-700"
                                  : "border-slate-200 bg-slate-50 text-slate-600"
                              }`}
                            >
                              #{tag}
                            </span>
                          ))}
                          {d.tags.length > 3 && (
                            <span className="text-[11px] text-slate-500">+{d.tags.length - 3}</span>
                          )}
                        </div>
                      </footer>
                    </article>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-10 text-center text-slate-500">
                  <p className="text-base font-semibold">No discussions match your filters.</p>
                  <p className="mt-1 text-sm">Adjust your search or start a new conversation to get the ball rolling.</p>
                </div>
              )}

              {filtered.length > ITEMS_PER_PAGE && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-yellow-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Previous
                  </button>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    Page {currentPage} of {Math.ceil(filtered.length / ITEMS_PER_PAGE)}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) =>
                        p < Math.ceil(filtered.length / ITEMS_PER_PAGE) ? p + 1 : p
                      )
                    }
                    disabled={currentPage >= Math.ceil(filtered.length / ITEMS_PER_PAGE)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-yellow-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </StudentLayout>
  );
}
