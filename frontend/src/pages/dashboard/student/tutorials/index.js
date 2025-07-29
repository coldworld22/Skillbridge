import { useState, useEffect } from "react";
import StudentLayout from "@/components/layouts/StudentLayout";
import { fetchPublishedTutorials } from "@/services/tutorialService";
import StudentTutorialCard from "@/components/tutorials/StudentTutorialCard";

export default function StudentTutorialsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("title");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchPublishedTutorials();
        const enriched = data.map((tut) => {
          const saved = localStorage.getItem(`progress-tutorial-${tut.id}`);
          const progress = saved ? JSON.parse(saved) : { completedChapters: [], completedQuiz: false };
          return {
            ...tut,
            completedLessons: progress.completedChapters.length,
            totalLessons: tut.chapters?.length || 0,
            isCompleted: progress.completedQuiz,
          };
        });
        setTutorials(enriched);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load tutorials");
        setLoading(false);
      }
    };
    load();
  }, []);

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
      <StudentLayout>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-48 bg-gray-200 rounded-md animate-pulse"
            />
          ))}
        </div>
      </StudentLayout>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <StudentLayout>
      <div className="p-6 space-y-6 text-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">📚 My Tutorials</h1>
            <span className="text-sm text-gray-500">({sorted.length} found)</span>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tutorials..."
              className="px-3 py-2 border border-gray-300 rounded-md text-sm w-full md:w-64"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 px-2 py-2 rounded-md text-sm"
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 px-2 py-2 rounded-md text-sm"
            >
              <option value="title">Title</option>
              <option value="rating">Rating</option>
              <option value="progress">Progress</option>
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
            <p>No tutorials match your criteria.</p>
            <a href="/dashboard/student/tutorials" className="text-blue-600 hover:underline text-sm mt-2 inline-block">Browse all tutorials</a>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}