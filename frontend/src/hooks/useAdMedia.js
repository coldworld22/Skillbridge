import { useState, useEffect } from "react";

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];

/**
 * Reusable hook for handling ad media (image & video) selection and cleanup.
 * Expects translation function `t`, error setter `setError`, and optional
 * `setFormData` to update parent form state when media changes.
 */
export default function useAdMedia({ t, setError, setFormData }) {
  const [mediaType, setMediaType] = useState("image");
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError?.(t("invalid_image_type"));
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError?.(t("image_too_large", { size: "5MB" }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setError?.(null);
      setFormData?.((prev) => ({ ...prev, image: file }));
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      setError?.(t("invalid_video_type"));
      return;
    }

    if (file.size > MAX_VIDEO_SIZE) {
      setError?.(t("video_too_large", { size: "50MB" }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (videoPreview && videoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(videoPreview);
      }
      setVideoFile(file);
      setVideoPreview(ev.target.result);
      setError?.(null);
    };
    reader.readAsDataURL(file);
  };

  const handleMediaTypeChange = (e) => {
    const type = e.target.value;
    setMediaType(type);
    if (type === "image") {
      if (videoPreview && videoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(videoPreview);
      }
      setVideoFile(null);
      setVideoPreview("");
    } else {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setFormData?.((prev) => ({ ...prev, image: null }));
      setImagePreview("");
    }
  };

  const removeMedia = () => {
    if (mediaType === "image") {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setFormData?.((prev) => ({ ...prev, image: null }));
      setImagePreview("");
    } else {
      if (videoPreview && videoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(videoPreview);
      }
      setVideoFile(null);
      setVideoPreview("");
    }
  };

  useEffect(() => {
    return () => {
      if (videoPreview && videoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(videoPreview);
      }
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [videoPreview, imagePreview]);

  return {
    mediaType,
    setMediaType,
    imagePreview,
    setImagePreview,
    videoFile,
    videoPreview,
    setVideoPreview,
    handleImageChange,
    handleVideoChange,
    handleMediaTypeChange,
    removeMedia,
  };
}
