import React from "react";
import { useTranslation } from "next-i18next";

const VideoPreviewList = ({
  videos = [],
  onSelect = () => {},
  currentIndex = 0,
  completed = [],
}) => {
  const { t } = useTranslation("tutorials", { keyPrefix: "detail" });
  if (!videos.length) return null;

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-white mb-4">
        🎞️ {t("lessons_heading", { defaultValue: "Lessons" })}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {videos.map((vid, idx) => (
          <div
            key={vid.id ?? idx}
            onClick={() => !vid.locked && onSelect(idx)}
            role={vid.locked ? "presentation" : "button"}
            aria-disabled={vid.locked ? "true" : "false"}
            className={`rounded overflow-hidden border transition ${
              vid.locked
                ? "cursor-not-allowed border-gray-800 opacity-70"
                : "cursor-pointer " +
                  (currentIndex === idx ? "border-yellow-400" : "border-gray-700")
            }`}
          >
            <div className="relative">
              {vid.locked || !vid.src ? (
                <div className="w-full h-32 bg-gray-800 flex items-center justify-center text-gray-300 text-sm">
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true">🔒</span>
                    {t("video_locked", { defaultValue: "Locked" })}
                  </span>
                </div>
              ) : (
                <video src={vid.src} muted className="w-full h-32 object-cover" />
              )}
              {completed.includes(vid.id) && !vid.locked && (
                <span className="absolute top-1 right-1 bg-green-600 text-white text-xs px-1 rounded">✓</span>
              )}
              {vid.isPreview && (
                <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1 rounded">
                  {t("preview_badge", { defaultValue: "Preview" })}
                </span>
              )}
              {vid.locked && (
                <span className="absolute bottom-1 right-1 bg-gray-900/80 text-white text-xs px-2 py-0.5 rounded">
                  {t("unlock_badge", { defaultValue: "Enroll to unlock" })}
                </span>
              )}
            </div>
            <div
              className={`p-2 text-sm ${
                vid.locked
                  ? "bg-gray-900 text-gray-500"
                  : currentIndex === idx
                  ? "bg-yellow-500 text-black"
                  : "bg-gray-800 text-white"
              }`}
            >
              {vid.title || `Lesson ${idx + 1}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoPreviewList;
