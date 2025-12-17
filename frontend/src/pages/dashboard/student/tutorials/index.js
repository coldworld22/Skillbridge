import { useState, useEffect } from "react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import StudentLayout from "@/components/layouts/StudentLayout";
import {
  fetchTutorialProgress,
  getMyEnrolledTutorials,
} from "@/services/tutorialService";
import StudentTutorialCard from "@/components/tutorials/StudentTutorialCard";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import withAuthProtection from "@/hooks/withAuthProtection";

function StudentTutorialsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("title");
  const { t } = useTranslation("tutorials");
  const tr = (key, def, opts) => {
    const res = t(key, opts);
    return res === key ? def : res;
  };

  useEffect(() => {
    let canceled = false;

    const load = async () => {
      try {
        const enrolled = await getMyEnrolledTutorials();
        if (canceled) return;

        const enriched = await Promise.all(
          enrolled.map(async (tut) => {
            let status = null;
            try {
              status = await fetchTutorialProgress(tut.id);
            } catch (err) {
              if (
                err?.response &&
                [401, 403, 404, 500, 501].includes(err.response.status)
              ) {
                status = null;
              } else {
                console.error("Failed to fetch tutorial progress", err);
              }
            }

            const totalLessons =
              tut.chapter_count ||
              (Array.isArray(tut.chapters) ? tut.chapters.length : 0);

            let fallbackCompleted = 0;
            let fallbackCompleteFlag = false;
            if (typeof window !== "undefined") {
              const stored = localStorage.getItem(
                `progress-tutorial-${tut.id}`,
              );
              if (stored) {
                try {
                  const parsed = JSON.parse(stored);
                  fallbackCompleted = Array.isArray(parsed.completedChapters)
                    ? parsed.completedChapters.length
                    : 0;
                  fallbackCompleteFlag = Boolean(parsed.completedQuiz);
                } catch {
                  fallbackCompleted = 0;
                  fallbackCompleteFlag = false;
                }
              }
            }

            const progressPercent =
              typeof status?.progress === "number"
                ? status.progress
                : totalLessons
                ? (fallbackCompleted / totalLessons) * 100
                : 0;

            const completedLessons =
              totalLessons > 0
                ? Math.min(
                    totalLessons,
                    Math.round((progressPercent / 100) * totalLessons),
                  )
                : fallbackCompleted;

            const isCompleted =
              status?.status === "completed" ||
              progressPercent >= 100 ||
              fallbackCompleteFlag;

            return {
              ...tut,
              completedLessons,
              totalLessons,
              isCompleted,
              progressPercent,
            };
          }),
        );

        if (!canceled) {
          setTutorials(enriched);
        }
      } catch (err) {
        if (canceled) return;
        console.error(err);
        setError(tr("list.load_error", "Failed to load tutorials"));
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      canceled = true;
    };
  }, [tr]);

  const filtered = tutorials.filter((tut) => {
    const matchesSearch = tut.title
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "completed" && tut.isCompleted) ||
      (filter === "in-progress" && !tut.isCompleted);
    return matchesSearch && matchesFilter;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "rating") {
      return (b.rating ?? 0) - (a.rating ?? 0);
    }
    if (sortBy === "progress") {
      const aProg = a.totalLessons
        ? a.completedLessons / a.totalLessons
        : 0;
      const bProg = b.totalLessons
        ? b.completedLessons / b.totalLessons
        : 0;
      return bProg - aProg;
    }
    return a.title.localeCompare(b.title);
  });

  if (loading) {
    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 bg-gray-200 rounded-md animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-500" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 text-gray-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{tr("studentPage.heading", "📚 My Tutorials")}</h1>
          <span className="text-sm text-gray-500">(
            {tr("studentPage.found", `${sorted.length} found`, { count: sorted.length })}
          )</span>
        </div>
        <div className="flex gap-2 items-center">
          <label htmlFor="student-tutorial-search" className="sr-only">
            {tr("studentPage.search_label", "Search tutorials")}
          </label>
          <input
            id="student-tutorial-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tr("studentPage.search_placeholder", "Search tutorials...")}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm w-full md:w-64"
          />
          <label htmlFor="student-tutorial-filter" className="sr-only">
            {tr("studentPage.filter_label", "Filter tutorials")}
          </label>
          <select
            id="student-tutorial-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 px-2 py-2 rounded-md text-sm"
          >
            <option value="all">{tr("studentPage.filter.all", "All")}</option>
            <option value="completed">{tr("studentPage.filter.completed", "Completed")}</option>
            <option value="in-progress">{tr("studentPage.filter.in_progress", "In Progress")}</option>
          </select>
          <label htmlFor="student-tutorial-sort" className="sr-only">
            {tr("studentPage.sort_label", "Sort tutorials")}
          </label>
          <select
            id="student-tutorial-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 px-2 py-2 rounded-md text-sm"
          >
            <option value="title">{tr("studentPage.sort.title", "Title")}</option>
            <option value="rating">{tr("studentPage.sort.rating", "Rating")}</option>
            <option value="progress">{tr("studentPage.sort.progress", "Progress")}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((tut) => (
          <StudentTutorialCard key={tut.id} tutorial={tut} />
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="text-center text-gray-500">
          <p>{tr("studentPage.no_match", "No tutorials match your criteria.")}</p>
          <a
            href="/dashboard/student/tutorials"
            className="text-blue-600 hover:underline text-sm mt-2 inline-block"
          >
            {tr("studentPage.browse_all", "Browse all tutorials")}
          </a>
        </div>
      )}
    </div>
  );
}

const ProtectedStudentTutorialsPage = withAuthProtection(StudentTutorialsPage, ["student"]);
ProtectedStudentTutorialsPage.getLayout = (page) => <StudentLayout>{page}</StudentLayout>;

export default ProtectedStudentTutorialsPage;

export async function getServerSideProps(ctx) {
  const { req, locale, resolvedUrl } = ctx;
  const cookieHeader = req?.headers?.cookie || "";
  const hasRefresh = cookieHeader.split(";").some((c) => c.trim().startsWith("refreshToken="));

  if (!hasRefresh) {
    return {
      redirect: {
        destination: `/auth/login?next=${encodeURIComponent(resolvedUrl || "/")}`,
        permanent: false,
      },
    };
  }

  // Load all namespaces used by this page and its layout (Header/Sidebar)
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["tutorials", "dashboard", "common"],
        nextI18NextConfig,
      )),
    },
  };
}
