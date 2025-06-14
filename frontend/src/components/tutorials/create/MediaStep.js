import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function MediaStep({ tutorialData, setTutorialData, onNext, onBack }) {
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleThumbnailUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size < 2 * 1024 * 1024 && ["image/jpeg", "image/png"].includes(file.type)) {
      const url = URL.createObjectURL(file);
      setThumbnailPreview(url);
      setTutorialData((prev) => ({ ...prev, thumbnail: file }));
    } else {
      alert("❌ Please upload a JPG/PNG file less than 2MB.");
    }
  };

  const handlePreviewUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size < 50 * 1024 * 1024 && ["video/mp4", "video/webm"].includes(file.type)) {
      const url = URL.createObjectURL(file);
      setPreviewVideo(url);
      setTutorialData((prev) => ({ ...prev, preview: file }));
      // Simulate progress
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    } else {
      alert("❌ Please upload an MP4/WebM video less than 50MB.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Thumbnail Upload */}
      <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center">
        <h3 className="font-bold text-gray-700 mb-4">📷 Upload Thumbnail</h3>
        {thumbnailPreview ? (
          <div className="flex flex-col items-center space-y-3">
            <img src={thumbnailPreview} alt="Thumbnail Preview" className="h-48 rounded shadow" />
            <Button
              onClick={() => {
                setThumbnailPreview(null);
                setTutorialData((prev) => ({ ...prev, thumbnail: null }));
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Remove Thumbnail
            </Button>
          </div>
        ) : (
          <>
            <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" id="thumbnail-upload" />
            <label htmlFor="thumbnail-upload" className="cursor-pointer bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-6 rounded">
              Select Image
            </label>
          </>
        )}
      </div>

      {/* Preview Video Upload */}
      <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center">
        <h3 className="font-bold text-gray-700 mb-4">🎥 Upload Preview Video</h3>
        {previewVideo ? (
          <div className="flex flex-col items-center space-y-3">
            <video controls src={previewVideo} className="h-48 rounded shadow" />
            {uploadProgress < 100 && (
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div className="bg-yellow-400 h-full" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            )}
            <Button
              onClick={() => {
                setPreviewVideo(null);
                setUploadProgress(0);
                setTutorialData((prev) => ({ ...prev, preview: null }));
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Remove Preview Video
            </Button>
          </div>
        ) : (
          <>
            <input type="file" accept="video/mp4,video/webm" onChange={handlePreviewUpload} className="hidden" id="preview-upload" />
            <label htmlFor="preview-upload" className="cursor-pointer bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-6 rounded">
              Select Video
            </label>
          </>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-8">
        <Button onClick={onBack} className="bg-gray-400 hover:bg-gray-500 text-white">
          ⬅️ Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!thumbnailPreview || !previewVideo}
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          ➡️ Next Step
        </Button>
      </div>
    </div>
  );
}
