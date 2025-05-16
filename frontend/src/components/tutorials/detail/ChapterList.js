// ✅ 1. ChapterList.js
import { Play, CheckCircle } from "lucide-react";

const ChapterList = ({ chapters = [], onSelect = () => {}, currentIndex = 0, completedChapters = [] }) => {
  if (!chapters.length) return null;

  return (
    <div className="mb-12">
      <h2 className="text-xl font-semibold text-white mb-4">\ud83d\udcda Chapters</h2>
      <ul className="space-y-4">
        {chapters.map((chapter, index) => {
          const isActive = index === currentIndex;
          const isCompleted = completedChapters.includes(index);

          return (
            <li
              key={index}
              onClick={() => onSelect(index)}
              className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition border ${
                isActive
                  ? "bg-yellow-500 text-black border-yellow-400"
                  : "bg-gray-800 hover:bg-gray-700 border-gray-700"
              }`}
            >
              <div className="mt-1">
                {isCompleted ? (
                  <CheckCircle className="text-green-400 w-5 h-5" />
                ) : (
                  <Play className="text-yellow-400 w-5 h-5" />
                )}
              </div>
              <div className="flex flex-col">
                <p className={`font-medium ${isActive ? "text-black" : "text-white"}`}>{chapter.title}</p>
                <p className={`text-sm ${isActive ? "text-black/70" : "text-gray-400"}`}>{chapter.duration} min</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ChapterList;