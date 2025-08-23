import Link from "next/link";
import { FaBookOpen, FaPlayCircle, FaCheckCircle, FaStar } from "react-icons/fa";
import { useTranslation } from "next-i18next";

export default function StudentTutorialCard({ tutorial }) {
  const progressPercent = tutorial.totalLessons
    ? (tutorial.completedLessons / tutorial.totalLessons) * 100
    : 0;
  const { t } = useTranslation("tutorials", { keyPrefix: "card" });
  const tr = (key, def) => {
    const res = t(key);
    return res === key ? def : res;
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition">
      <div className="relative">
        <img
          src={tutorial.thumbnail || "/default-thumbnail.jpg"}
          alt={tutorial.title}
          className="w-full h-44 object-cover"
          loading="lazy"
        />
        <span className="absolute top-2 left-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
          {tutorial.category}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FaBookOpen className="text-yellow-500" /> {tutorial.title}
        </h2>
        <p className="text-sm text-gray-500">
          {tr("instructor", "Instructor")}: {tutorial.instructor}
        </p>

        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>
            {tutorial.completedLessons}/{tutorial.totalLessons} {tr("lessons", "lessons")}
          </span>
          {tutorial.isCompleted ? (
            <span className="text-green-600 flex items-center gap-1">
              <FaCheckCircle /> {tr("completed", "Completed")}
            </span>
          ) : (
            <span className="text-blue-600 flex items-center gap-1">
              <FaPlayCircle /> {tr("in_progress", "In Progress")}
            </span>
          )}
        </div>

        <div className="flex items-center text-xs text-gray-500 gap-1">
          <FaStar className="text-yellow-400" />
          {tutorial.rating?.toFixed?.(1) ?? tutorial.rating}
        </div>

        <Link
          href={`/tutorials/${tutorial.id}`}
          className="inline-flex items-center gap-2 text-sm mt-2 text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md transition-colors"
        >
          {tutorial.isCompleted ? tr("review", "Review") : tr("continue", "Continue")}
        </Link>
      </div>
    </div>
  );
}
