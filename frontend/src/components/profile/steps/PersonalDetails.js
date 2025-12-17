import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/utils/cropImage"; // Helper function for cropping
import { FaUpload, FaTimesCircle, FaCrop, FaCheck } from "react-icons/fa";
import styles from "./PersonalDetails.module.scss";

const PersonalDetails = ({ formData, setFormData, nextStep }) => {
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(formData.profilePicture || "");
  const [file, setFile] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  // ✅ Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" }); // Clear error when typing
  };

  // ✅ Handle Image Selection
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      const imageUrl = URL.createObjectURL(file);
      setPreview(imageUrl);
      setFile(file);
      setShowCropper(true);
    }
  };

  // ✅ Handle Crop Complete
  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // ✅ Apply Cropping
  const handleCropSave = async () => {
    try {
      const blob = await getCroppedImg(preview, croppedAreaPixels);
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      const url = URL.createObjectURL(blob);
      setPreview(url);
      setFormData({ ...formData, profilePicture: blob });
      setShowCropper(false);
    } catch (error) {
      console.error("Crop Error:", error);
    }
  };

  // ✅ Remove Profile Picture
  const handleRemoveImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview("");
    setFormData({ ...formData, profilePicture: null });
  };

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Personal Details</h2>

      {/* ✅ Profile Picture Upload & Crop */}
      <div className={styles.upload}>
        {preview && !showCropper ? (
          <div className={styles.previewWrap}>
            <img src={preview} alt="Profile Preview" className={styles.avatar} />
            <button onClick={handleRemoveImage} className={styles.removeBtn} type="button">
              <FaTimesCircle />
            </button>
            <button
              onClick={() => setShowCropper(true)}
              className={styles.cropBtn}
              type="button"
            >
              <FaCrop /> Crop Image
            </button>
          </div>
        ) : (
          <label className={styles.uploadLabel}>
            <FaUpload size={20} />
            <span className={styles.helper}>Upload Profile Picture</span>
            <input type="file" accept="image/*" className={styles.hiddenInput} onChange={handleImageUpload} />
          </label>
        )}
      </div>

      {/* ✅ Image Cropping UI */}
      {showCropper && (
        <div className={styles.cropper}>
          <Cropper
            image={preview}
            crop={crop}
            zoom={zoom}
            aspect={1} // Set cropping to 1:1 aspect ratio
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
          <div className={styles.cropActions}>
            <button
              onClick={handleCropSave}
              className={styles.saveCrop}
              type="button"
            >
              <FaCheck /> Save Crop
            </button>
          </div>
        </div>
      )}

      {/* ✅ Name Input */}
      <div className={styles.field}>
        <label className={styles.label}>Full Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={styles.input}
        />
      </div>

      {/* ✅ Email Input */}
      <div className={styles.field}>
        <label className={styles.label}>Email Address</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={styles.input}
        />
      </div>

      {/* ✅ Phone Input */}
      <div className={styles.field}>
        <label className={styles.label}>Phone Number</label>
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className={styles.input}
        />
      </div>

      {/* ✅ Next Button */}
      <button
        className={styles.submit}
        onClick={nextStep}
        type="button"
      >
        Next
      </button>
    </div>
  );
};

export default PersonalDetails;
