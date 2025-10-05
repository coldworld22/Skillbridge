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

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (!file) {
        setFileError(null);
        return;
      }

      const handleInvalidFile = (errorKey, options = {}) => {
        setFileError(t(errorKey, options));
        setCoverPreview(null);
        e.target.value = '';
      };

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        handleInvalidFile('validation.invalidFileType');
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        handleInvalidFile('validation.fileTooLarge', {
          size: `${MAX_IMAGE_SIZE_MB}MB`,
        });
        return;
      }

      setFileError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    },
    [t]
  );

  const handleRemoveImage = useCallback(() => {
    setCoverPreview(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  return {
    coverPreview,
    fileError,
    fileInputRef,
    handleFileChange,
    handleRemoveImage,
    setCoverPreview,
  };
}
