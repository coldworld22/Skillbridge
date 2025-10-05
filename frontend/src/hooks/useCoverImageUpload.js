import { useState, useRef, useCallback } from 'react';
import { MAX_IMAGE_SIZE, MAX_IMAGE_SIZE_MB } from '@/utils/constants';

/**
 * Hook to handle cover image uploads with validation and preview.
 * @param {function} t - translation function for error messages
 */
export default function useCoverImageUpload(t) {
  const [coverPreview, setCoverPreview] = useState(null);
  const [fileError, setFileError] = useState(null);
  const fileInputRef = useRef(null);

  const resetFileSelection = useCallback(() => {
    setCoverPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setFileError(t('validation.invalidFileType'));
        resetFileSelection();
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        setFileError(t('validation.fileTooLarge', { size: `${MAX_IMAGE_SIZE_MB}MB` }));
        resetFileSelection();
        return;
      }

      setFileError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    },
    [resetFileSelection, t]
  );

  const handleRemoveImage = useCallback(() => {
    setFileError(null);
    resetFileSelection();
  }, [resetFileSelection]);

  return {
    coverPreview,
    fileError,
    fileInputRef,
    handleFileChange,
    handleRemoveImage,
    setCoverPreview,
  };
}
