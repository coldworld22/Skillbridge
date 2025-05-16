import { useState } from "react";
import { toast } from "react-hot-toast";
import { FaPlus, FaTrash, FaPlay } from "react-icons/fa";

export default function CurriculumStep({ tutorialData, setTutorialData, onNext, onBack }) {
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleAddChapter = () => {
    setTutorialData((prev) => ({
      ...prev,
      chapters: [
        ...prev.chapters,
        { title: "", duration: "", video: null, preview: false },
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
    updated[index][field] = value;
    setTutorialData((prev) => ({
      ...prev,
      chapters: updated,
    }));
  };

  const handleVideoUpload = (index, file) => {
    if (!file) return;
    setUploadingIndex(index);
    setUploadProgress(0);

    // Simulate upload
    const simulateUpload = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(simulateUpload);
          const videoUrl = URL.createObjectURL(file);
          handleChange(index, "video", videoUrl);
          setUploadingIndex(null);
          toast.success("🎬 Video uploaded successfully!");
          return 0;
        }
        return prev + 10;
      });
    }, 150);
  };

  return (
    <div className="space-y-8">
      {/* Heading */}
      <h2 className="text-2xl font-bold text-gray-800">📚 Curriculum</h2>

      {/* List of Chapters */}
      {tutorialData.chapters.map((chapter, index) => (
        <div key={index} className="p-6 bg-gray-100 rounded-lg shadow space-y-4 relative">
          {/* Remove Button */}
          <button
            onClick={() => handleRemoveChapter(index)}
            className="absolute top-3 right-3 text-red-500 hover:text-red-700"
            title="Remove Chapter"
          >
            <FaTrash />
          </button>

          {/* Chapter Title */}
          <div>
            <label className="block mb-1 font-semibold text-gray-700">Chapter Title</label>
            <input
              type="text"
              value={chapter.title}
              onChange={(e) => handleChange(index, "title", e.target.value)}
              className="p-2 border rounded w-full"
              placeholder="e.g. Introduction to React"
            />
          </div>

          {/* Chapter Duration */}
          <div>
            <label className="block mb-1 font-semibold text-gray-700">Duration (e.g. 5 min)</label>
            <input
              type="text"
              value={chapter.duration}
              onChange={(e) => handleChange(index, "duration", e.target.value)}
              className="p-2 border rounded w-full"
              placeholder="e.g. 10 min"
            />
          </div>

          {/* Chapter Video Upload */}
          <div>
            <label className="block mb-1 font-semibold text-gray-700">Upload Chapter Video</label>
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
            <label className="text-gray-700">Allow Free Preview</label>
          </div>
        </div>
      ))}

      {/* Add Chapter Button */}
      <button
        onClick={handleAddChapter}
        className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-full transition"
      >
        <FaPlus /> Add New Chapter
      </button>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-full font-bold"
        >
          ⬅️ Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full font-bold"
        >
          Next ➡️
        </button>
      </div>
    </div>
  );
}
