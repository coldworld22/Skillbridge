import { useState, useRef, useEffect, useCallback } from 'react';

const DEFAULT_MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * Hook to handle image and video uploads with progress tracking.
 * Accepts optional translation function `t`, error handler `onError`,
 * callbacks for when media is selected, and an optional `uploadFn` for
 * performing the actual upload.
 */
export default function useMediaUploader({
  t,
  onError,
  onImageSelect,
  onVideoSelect,
  uploadFn,
  maxImageSize = DEFAULT_MAX_IMAGE_SIZE,
  maxVideoSize = DEFAULT_MAX_VIDEO_SIZE,
} = {}) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageUploading, setImageUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const videoIntervalRef = useRef(null);
  const videoUrlRef = useRef(null);

  const handleImageUpload = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > maxImageSize) {
        onError?.(t ? t('image_size_exceeded') : 'Image size exceeded');
        return;
      }

      setImageUploading(true);
      setUploadProgress(0);

      if (uploadFn) {
        uploadFn(file, 'image', setUploadProgress)
          .then((url) => {
            onImageSelect?.(file, url);
          })
          .catch(() => {
            onError?.(t ? t('upload_failed') : 'Upload failed');
          })
          .finally(() => {
            setImageUploading(false);
          });
        return;
      }

      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };
      reader.onloadend = () => {
        onImageSelect?.(file, reader.result);
        setImageUploading(false);
      };
      reader.onerror = () => {
        onError?.(t ? t('image_preview_failed') : 'Failed to load image preview.');
        setImageUploading(false);
      };
      reader.readAsDataURL(file);
    },
    [maxImageSize, onError, onImageSelect, t, uploadFn]
  );

  const handleVideoUpload = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > maxVideoSize) {
        onError?.(t ? t('video_size_exceeded') : 'Video size exceeded');
        return;
      }

      setVideoUploading(true);
      setUploadProgress(0);

      if (uploadFn) {
        uploadFn(file, 'video', setUploadProgress)
          .then((url) => {
            onVideoSelect?.(file, url);
          })
          .catch(() => {
            onError?.(t ? t('upload_failed') : 'Upload failed');
          })
          .finally(() => {
            setVideoUploading(false);
          });
        return;
      }

      if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
            videoUrlRef.current = URL.createObjectURL(file);
            onVideoSelect?.(file, videoUrlRef.current);
            setVideoUploading(false);
            return 100;
          }
          return prev + 10;
        });
      }, 300);
    },
    [maxVideoSize, onError, onVideoSelect, t, uploadFn]
  );

  useEffect(() => {
    return () => {
      if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    };
  }, []);

  return {
    uploadProgress,
    imageUploading,
    videoUploading,
    handleImageUpload,
    handleVideoUpload,
    setUploadProgress,
  };
}

