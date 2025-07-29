import Link from "next/link";
import { FaBookOpen, FaPlayCircle, FaCheckCircle, FaStar } from "react-icons/fa";

export default function StudentTutorialCard({ tutorial }) {
  const progressPercent = tutorial.totalLessons
    ? (tutorial.completedLessons / tutorial.totalLessons) * 100
    : 0;

  return (
    <div className="bg-white shadow rounded-lg p-4 space-y-2 border border-gray-200">
      <img
        src={tutorial.thumbnail || "/default-thumbnail.jpg"}
        alt={tutorial.title}
        className="w-full h-40 object-cover rounded-md"
      />
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <span className="inline-block text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
          {tutorial.category}
        </span>
        <FaBookOpen className="text-yellow-500" /> {tutorial.title}
      </h2>
      <p className="text-xs text-gray-500">Instructor: {tutorial.instructor}</p>
      <div className="w-full bg-gray-100 h-2 rounded-full relative">
        <div className="absolute right-1 -top-4 text-xs text-gray-500">
          {Math.round(progressPercent)}%
        </div>
        <div
          className="h-2 bg-yellow-400 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>
          {tutorial.completedLessons}/{tutorial.totalLessons} lessons
        </span>
        {tutorial.isCompleted ? (
          <span className="text-green-600 flex items-center gap-1">
            <FaCheckCircle /> Completed
          </span>
        ) : (
          <span className="text-blue-600 flex items-center gap-1">
            <FaPlayCircle /> In Progress
          </span>
        )}
      </div>
      <div className="flex items-center text-xs text-gray-500 gap-1">
        <FaStar className="text-yellow-400" />
        {tutorial.rating?.toFixed?.(1) ?? tutorial.rating}
      </div>
      <Link
        href={`/tutorials/${tutorial.id}`}
        className="inline-flex items-center gap-2 text-sm mt-2 text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md transition"
      >
        {tutorial.isCompleted ? "Review" : "Continue"}
      </Link>
    </div>
  );
}
