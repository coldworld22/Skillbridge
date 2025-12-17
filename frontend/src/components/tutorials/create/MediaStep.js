import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "next-i18next";

export default function MediaStep({ tutorialData, setTutorialData, onNext, onBack }) {
  const { t } = useTranslation("tutorials");
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (tutorialData?.thumbnail && !thumbnailPreview) {
      if (tutorialData.thumbnail instanceof File) {
        setThumbnailPreview(URL.createObjectURL(tutorialData.thumbnail));
      } else {
        setThumbnailPreview(tutorialData.thumbnail);
      }
    }
    if (tutorialData?.preview && !previewVideo) {
      if (tutorialData.preview instanceof File) {
        setPreviewVideo(URL.createObjectURL(tutorialData.preview));
      } else {
        setPreviewVideo(tutorialData.preview);
      }
      setUploadProgress(100);
    }
  }, [tutorialData.thumbnail, tutorialData.preview, thumbnailPreview, previewVideo]);

  // Clean up generated object URLs when media changes or component unmounts
  useEffect(() => {
    return () => {
      if (thumbnailPreview?.startsWith?.("blob:")) {
        URL.revokeObjectURL(thumbnailPreview);
      }
      if (previewVideo?.startsWith?.("blob:")) {
        URL.revokeObjectURL(previewVideo);
      }
    };
  }, [thumbnailPreview, previewVideo]);

  const handleThumbnailUpload = (e) => {
    const file = e.target.files[0];
    if (
      file &&
      file.size < 10 * 1024 * 1024 &&
      ["image/jpeg", "image/png"].includes(file.type)
    ) {
      if (thumbnailPreview?.startsWith?.("blob:")) {
        URL.revokeObjectURL(thumbnailPreview);
      }
      const url = URL.createObjectURL(file);
      setThumbnailPreview(url);
      setTutorialData((prev) => ({ ...prev, thumbnail: file }));
    } else {
      alert(t("create.thumbnail_size_error"));
    }
  };

  const handlePreviewUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size < 50 * 1024 * 1024 && ["video/mp4", "video/webm"].includes(file.type)) {
      if (previewVideo?.startsWith?.("blob:")) {
        URL.revokeObjectURL(previewVideo);
      }
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
      alert(t("create.media.preview_video_error"));
    }
  };

  return (
    <div className="space-y-8">
      {/* Thumbnail Upload */}
      <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center">
        <h3 className="font-bold text-gray-700 mb-4">
          {t("create.media.upload_thumbnail")}
        </h3>
        {thumbnailPreview ? (
          <div className="flex flex-col items-center space-y-3">
            <img
              src={thumbnailPreview}
              alt={t("create.media.thumbnail_preview_alt")}
              className="h-48 rounded shadow"
            />
            <Button
              onClick={() => {
                setThumbnailPreview(null);
                setTutorialData((prev) => ({ ...prev, thumbnail: null }));
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {t("create.media.remove_thumbnail")}
            </Button>
          </div>
        ) : (
          <>
            <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" id="thumbnail-upload" />
            <label
              htmlFor="thumbnail-upload"
              className="cursor-pointer bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-6 rounded"
            >
              {t("create.media.select_image")}
            </label>
          </>
        )}
      </div>

      {/* Preview Video Upload */}
      <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center">
        <h3 className="font-bold text-gray-700 mb-4">
          {t("create.media.upload_preview_video")}
        </h3>
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
              {t("create.media.remove_preview_video")}
            </Button>
          </div>
        ) : (
          <>
            <input
              type="file"
              accept="video/mp4,video/webm"
              onChange={handlePreviewUpload}
              className="hidden"
              id="preview-upload"
            />
            <label
              htmlFor="preview-upload"
              className="cursor-pointer bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-6 rounded"
            >
              {t("create.media.select_video")}
            </label>
          </>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-8">
        <Button onClick={onBack} className="bg-gray-400 hover:bg-gray-500 text-white">
          {t("create.media.back")}
        </Button>
        <Button
          onClick={onNext}
          disabled={!thumbnailPreview || !previewVideo}
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          {t("create.media.next")}
        </Button>
      </div>
    </div>
  );
}
