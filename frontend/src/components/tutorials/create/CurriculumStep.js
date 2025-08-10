import { useState } from "react";
import { useTranslation } from "next-i18next";
import { toast } from "react-hot-toast";
import { FaPlus, FaTrash, FaPlay } from "react-icons/fa";
import { uploadChapterVideo } from "@/services/admin/tutorialChapterService";

export default function CurriculumStep({ tutorialData, setTutorialData, onNext, onBack }) {
  const { t } = useTranslation("tutorials");
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleAddChapter = () => {
    setTutorialData((prev) => ({
      ...prev,
      chapters: [
        ...prev.chapters,
        { title: "", duration: "", video: null, videoUrl: "", preview: false },
      ],
    }));
  };

  const handleRemoveChapter = (index) => {
    const updated = [...tutorialData.chapters];
    updated.splice(index, 1);
    setTutorialData((prev) => ({
      ...prev,
      chapters: updated,
    }));
  };

  const handleChange = (index, field, value) => {
    const updated = [...tutorialData.chapters];
    if (field === "duration") {
      updated[index][field] = value.replace(/[^0-9]/g, "");
    } else {
      updated[index][field] = value;
    }
    setTutorialData((prev) => ({
      ...prev,
      chapters: updated,
    }));
  };

  const handleVideoUpload = async (index, file) => {
    if (!file) return;
    setUploadingIndex(index);
    setUploadProgress(0);

    try {
      const res = await uploadChapterVideo(file, (e) => {
        const progress = Math.round((e.loaded * 100) / e.total);
        setUploadProgress(progress);
      });
      const serverPath = res.video_url;
      const previewUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}${serverPath}`;
      handleChange(index, "video", previewUrl);
      handleChange(index, "videoUrl", serverPath);
      toast.success(t("create.curriculum.video_upload_success"));
    } catch (err) {
      toast.error(t("create.curriculum.video_upload_error"));
    } finally {
      setUploadingIndex(null);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-8">
      {/* Heading */}
      <h2 className="text-2xl font-bold text-gray-800">
        {t("create.curriculum.heading")}
      </h2>

      {/* List of Chapters */}
      {tutorialData.chapters.map((chapter, index) => (
        <div key={index} className="p-6 bg-gray-100 rounded-lg shadow space-y-4 relative">
          {/* Remove Button */}
          <button
            onClick={() => handleRemoveChapter(index)}
            className="absolute top-3 right-3 text-red-500 hover:text-red-700"
            title={t("create.curriculum.remove_chapter")}
          >
            <FaTrash />
          </button>

          {/* Chapter Title */}
          <div>
            <label className="block mb-1 font-semibold text-gray-700">
              {t("create.curriculum.chapter_title")}
            </label>
            <input
              type="text"
              value={chapter.title}
              onChange={(e) => handleChange(index, "title", e.target.value)}
              className="p-2 border rounded w-full"
              placeholder={t(
                "create.curriculum.chapter_title_placeholder"
              )}
            />
          </div>

          {/* Chapter Duration */}
          <div>
            <label className="block mb-1 font-semibold text-gray-700">
              {t("create.curriculum.duration_label")}
            </label>
            <input
              type="number"
              value={chapter.duration}
              onChange={(e) => handleChange(index, "duration", e.target.value)}
              className="p-2 border rounded w-full"
              placeholder={t("create.curriculum.duration_placeholder")}
            />
          </div>

          {/* Chapter Video Upload */}
          <div>
            <label className="block mb-1 font-semibold text-gray-700">
              {t("create.curriculum.upload_video")}
            </label>
            {uploadingIndex === index ? (
              <div className="w-full bg-gray-300 rounded-full h-4">
                <div
                  className="bg-yellow-500 h-4 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            ) : chapter.video ? (
              <video
                src={chapter.video}
                controls
                className="w-full rounded mt-2"
              />
            ) : (
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleVideoUpload(index, e.target.files[0])}
                className="p-2 border rounded w-full bg-white"
              />
            )}
          </div>

          {/* Chapter Preview Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={chapter.preview}
              onChange={(e) => handleChange(index, "preview", e.target.checked)}
              className="form-checkbox text-yellow-500"
            />
            <label className="text-gray-700">
              {t("create.curriculum.allow_preview")}
            </label>
          </div>
        </div>
      ))}

      {/* Add Chapter Button */}
      <button
        onClick={handleAddChapter}
        className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-full transition"
      >
        <FaPlus /> {t("create.curriculum.add_chapter")}
      </button>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-full font-bold"
        >
          {t("create.curriculum.back")}
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full font-bold"
        >
          {t("create.curriculum.next")}
        </button>
      </div>
    </div>
  );
}
