import { useState, useEffect } from "react";
import StudentLayout from "@/components/layouts/StudentLayout";
import { FaBookOpen, FaPlayCircle, FaCheckCircle, FaFilter, FaSearch } from "react-icons/fa";

const mockTutorials = [
  {
    id: 1,
    title: "Mastering React.js",
    category: "Frontend",
    instructor: "John Doe",
    description: "Complete React.js course covering fundamentals and advanced topics.",
    chapters: ["Intro", "Components", "Hooks", "State Management"],
  },
  {
    id: 2,
    title: "Advanced JavaScript",
    category: "JavaScript",
    instructor: "Elon Dev",
    description: "Deep dive into JS ES6+, closures, promises, and more.",
    chapters: ["Scope", "Promises", "Async/Await", "Advanced Patterns"],
  },
];

export default function StudentTutorialsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [tutorials, setTutorials] = useState([]);

  useEffect(() => {
    const enriched = mockTutorials.map((tut) => {
      const saved = localStorage.getItem(`progress-tutorial-${tut.id}`);
      const progress = saved ? JSON.parse(saved) : { completedChapters: [], completedQuiz: false };
      return {
        ...tut,
        completedLessons: progress.completedChapters.length,
        totalLessons: tut.chapters.length,
        isCompleted: progress.completedQuiz,
      };
    });
    setTutorials(enriched);
  }, []);

  const filtered = tutorials.filter(tut => {
    const matchesSearch = tut.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || (filter === "completed" && tut.isCompleted) || (filter === "in-progress" && !tut.isCompleted);
    return matchesSearch && matchesFilter;
  });

  return (
    <StudentLayout>
      <div className="p-6 space-y-6 text-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">📚 My Tutorials</h1>
            <span className="text-sm text-gray-500">({filtered.length} found)</span>
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
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tut) => (
            <div key={tut.id} className="bg-white shadow rounded-lg p-4 space-y-2 border border-gray-200">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="inline-block text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{tut.category}</span>
                <FaBookOpen className="text-yellow-500" /> {tut.title}
              </h2>
              <p className="text-sm text-gray-600">{tut.description}</p>
              <p className="text-xs text-gray-500">Instructor: {tut.instructor}</p>
              <div className="w-full bg-gray-100 h-2 rounded-full relative">
                <div className="absolute right-1 top-[-18px] text-xs text-gray-500">
                  {Math.round((tut.completedLessons / tut.totalLessons) * 100)}%
                </div>
                <div
                  className="h-2 bg-yellow-400 rounded-full"
                  style={{ width: `${(tut.completedLessons / tut.totalLessons) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{tut.completedLessons}/{tut.totalLessons} lessons</span>
                {tut.isCompleted ? (
                  <span className="text-green-600 flex items-center gap-1"><FaCheckCircle /> Completed</span>
                ) : (
                  <span className="text-blue-600 flex items-center gap-1"><FaPlayCircle /> In Progress</span>
                )}
              </div>
              <a
                href={`/tutorials/${tut.id}`}
                className="inline-flex items-center gap-2 text-sm mt-2 text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md transition"
              >
                {tut.isCompleted ? "Review" : "Continue"}
              </a>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center text-gray-500">
            <p>No tutorials match your criteria.</p>
            <a href="/dashboard/student/tutorials" className="text-blue-600 hover:underline text-sm mt-2 inline-block">Browse all tutorials</a>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}