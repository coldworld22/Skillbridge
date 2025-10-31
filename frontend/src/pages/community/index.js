import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FaPlus } from "react-icons/fa";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import QuestionCard from "@/components/community/QuestionCard";
import Filters from "@/components/community/Filters";
import Pagination from "@/components/community/Pagination";
import { fetchDiscussions } from "@/services/communityService";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../next-i18next.config.js";
import { safeParseTags } from "@/utils/community/tags";

const QUESTIONS_PER_PAGE = 6;

const DEFAULT_FILTERS = {
  noAnswers: false,
  noAcceptedAnswer: false,
  hasBounty: false,
  sortBy: "Newest",
  tags: [],
};

const stripMarkdown = (value = "") =>
  value.replace(/[#_*`>~\-]+/g, " ").replace(/\s+/g, " ").trim();

const createExcerpt = (content, length = 180) => {
  const plain = stripMarkdown(
    content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")
  );
  if (!plain) {
    return "";
  }
  if (plain.length <= length) {
    return plain;
  }
  return `${plain.slice(0, length).trim()}…`;
};

const coerceNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const determineAnswersCount = (raw) => {
  if (typeof raw.replies_count === "number") return raw.replies_count;
  if (typeof raw.replies === "number") return raw.replies;
  if (typeof raw.answers_count === "number") return raw.answers_count;
  if (Array.isArray(raw.answers)) return raw.answers.length;
  if (Array.isArray(raw.replies)) return raw.replies.length;
  return 0;
};

const normalizeDiscussion = (raw) => {
  const tags = safeParseTags(raw.tags);
  const content = raw.description || raw.content || raw.body || "";
  const createdAt = raw.created_at || raw.date || null;
  const updatedAt =
    raw.updated_at || raw.last_activity_at || raw.last_activity || createdAt;

  return {
    id: raw.id,
    title: raw.title || "Untitled discussion",
    content,
    excerpt: createExcerpt(content),
    tags,
    votes: coerceNumber(raw.votes ?? raw.score),
    likes: coerceNumber(raw.likes ?? raw.like_count),
    views: coerceNumber(raw.views ?? raw.view_count),
    bounty: coerceNumber(raw.bounty ?? raw.bounty_amount),
    createdAt,
    updatedAt,
    resolved: Boolean(
      raw.resolved ?? raw.accepted_answer_id ?? raw.is_resolved ?? false
    ),
    answersCount: coerceNumber(determineAnswersCount(raw)),
    user: {
      name:
        raw.user?.name ||
        raw.user?.full_name ||
        raw.user?.username ||
        raw.user_name ||
        "Anonymous",
      avatar: raw.user?.avatar || raw.user_avatar || null,
    },
  };
};

const calculateTrendingScore = (question) =>
  question.votes * 3 + question.answersCount * 4 + question.likes * 2 + question.views;

const CommunityPage = () => {
  const { t } = useTranslation("common");
  const [questions, setQuestions] = useState([]);
  const [filters, setFilters] = useState(() => ({ ...DEFAULT_FILTERS }));
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDiscussions = useCallback(
    async (signal) => {
      setLoading(true);
      try {
        const list = await fetchDiscussions();
        if (signal?.aborted) return;
        const normalized = (list ?? []).map(normalizeDiscussion);
        setQuestions(normalized);
        setError("");
      } catch (err) {
        if (signal?.aborted) return;
        console.error("Failed to load discussions", err);
        setError(
          "We couldn't load community discussions right now. Please try again."
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    loadDiscussions(controller.signal);
    return () => controller.abort();
  }, [loadDiscussions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

  const availableTags = useMemo(() => {
    const tagSet = new Set();
    questions.forEach((question) => {
      question.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    let result = questions.filter((question) => {
      const matchesSearch =
        !term ||
        question.title.toLowerCase().includes(term) ||
        question.content.toLowerCase().includes(term) ||
        question.tags.some((tag) => tag.toLowerCase().includes(term));

      if (!matchesSearch) {
        return false;
      }

      if (filters.noAnswers && question.answersCount > 0) {
        return false;
      }

      if (filters.noAcceptedAnswer && question.resolved) {
        return false;
      }

      if (filters.hasBounty && question.bounty <= 0) {
        return false;
      }

      if (filters.tags.length) {
        const tagsLower = question.tags.map((tag) => tag.toLowerCase());
        const hasAllTags = filters.tags.every((tag) =>
          tagsLower.includes(tag.toLowerCase())
        );
        if (!hasAllTags) {
          return false;
        }
      }

      return true;
    });

    switch (filters.sortBy) {
      case "Recent Activity":
        result = result.sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt || 0) -
            new Date(a.updatedAt || a.createdAt || 0)
        );
        break;
      case "Most Answered":
        result = result.sort((a, b) => b.answersCount - a.answersCount);
        break;
      case "Top Voted":
        result = result.sort((a, b) => b.votes - a.votes);
        break;
      case "Trending":
        result = result.sort(
          (a, b) => calculateTrendingScore(b) - calculateTrendingScore(a)
        );
        break;
      case "Newest":
      default:
        result = result.sort(
          (a, b) =>
            new Date(b.createdAt || b.updatedAt || 0) -
            new Date(a.createdAt || a.updatedAt || 0)
        );
        break;
    }

    return result;
  }, [questions, filters, searchTerm]);

  const totalPages = Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE);

  useEffect(() => {
    if (currentPage > 1 && totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * QUESTIONS_PER_PAGE;
    return filteredQuestions.slice(start, start + QUESTIONS_PER_PAGE);
  }, [filteredQuestions, currentPage]);

  const handleResetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS });
    setSearchTerm("");
  };

  const pageTitle = t("community_forum", "Community Forum");

  return (
    <div className="bg-slate-950 text-white">
      <Navbar />
      <main>
        <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <div className="mx-auto max-w-6xl px-6 py-16 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-yellow-400">
              Community
            </p>
            <h1 className="mt-4 text-4xl font-bold md:text-5xl">{pageTitle}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 md:text-lg">
              Connect with fellow learners, ask questions, and share solutions
              with the community.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/community/ask"
                className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-6 py-3 font-semibold text-slate-900 shadow-lg transition hover:bg-yellow-300"
              >
                <FaPlus className="text-sm" />
                Ask a question
              </Link>
              <span className="text-sm text-slate-400">
                Use the filters to refine topics and surface the answers you
                need faster.
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16 pt-10">
          <div className="grid gap-10 lg:grid-cols-[280px,1fr]">
            <Filters
              filters={filters}
              onFiltersChange={(next) => setFilters({ ...next })}
              onReset={handleResetFilters}
              availableTags={availableTags}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              disabled={loading}
            />

            <div className="flex flex-col gap-6">
              {loading ? (
                <LoadingState />
              ) : error ? (
                <ErrorState message={error} onRetry={loadDiscussions} />
              ) : paginatedQuestions.length === 0 ? (
                <EmptyState />
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
                    <span>
                      Showing {paginatedQuestions.length} of{" "}
                      {filteredQuestions.length} discussion
                      {filteredQuestions.length === 1 ? "" : "s"}
                    </span>
                    {filters.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {filters.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-yellow-300"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {paginatedQuestions.map((question) => (
                    <QuestionCard key={question.id} question={question} />
                  ))}

                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

const LoadingState = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, index) => (
      <div
        key={index}
        className="animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
      >
        <div className="h-4 w-32 rounded bg-slate-700" />
        <div className="mt-4 h-5 w-3/4 rounded bg-slate-700" />
        <div className="mt-2 h-5 w-2/3 rounded bg-slate-800" />
      </div>
    ))}
  </div>
);

const ErrorState = ({ message, onRetry }) => (
  <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-10 text-center text-red-200">
    <h2 className="text-xl font-semibold text-red-100">
      Something went wrong
    </h2>
    <p className="mt-2 text-sm text-red-200/80">{message}</p>
    <button
      type="button"
      onClick={() => onRetry()}
      className="mt-6 inline-flex items-center justify-center rounded-full border border-red-400 px-6 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/20"
    >
      Try again
    </button>
  </div>
);

const EmptyState = () => (
  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-12 text-center text-slate-300">
    <h2 className="text-xl font-semibold text-white">
      No discussions match your filters
    </h2>
    <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
      Adjust your filters or start a new discussion to get the conversation
      going.
    </p>
    <Link
      href="/community/ask"
      className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-yellow-400 px-6 py-3 font-semibold text-slate-900 transition hover:bg-yellow-300"
    >
      <FaPlus className="text-sm" />
      Ask the community
    </Link>
  </div>
);

export default CommunityPage;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"], nextI18NextConfig)),
    },
  };
}
