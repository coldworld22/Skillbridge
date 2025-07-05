import React from "react";

const VideoPreviewList = ({ videos = [], onSelect = () => {}, currentIndex = 0, completed = [] }) => {
  if (!videos.length) return null;

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-white mb-4">🎞️ Lessons</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {videos.map((vid, idx) => (
          <div
            key={idx}
            onClick={() => onSelect(idx)}
            className={`cursor-pointer rounded overflow-hidden border ${currentIndex === idx ? "border-yellow-400" : "border-gray-700"}`}
          >
            <div className="relative">
              <video
                src={vid.src}
                muted
                className="w-full h-32 object-cover"
              />
              {completed.includes(idx) && (
                <span className="absolute top-1 right-1 bg-green-600 text-white text-xs px-1 rounded">✓</span>
              )}
            </div>
            <div className={`${currentIndex === idx ? "bg-yellow-500 text-black" : "bg-gray-800 text-white"} p-2 text-sm`}>
              {vid.title || `Lesson ${idx + 1}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoPreviewList;
