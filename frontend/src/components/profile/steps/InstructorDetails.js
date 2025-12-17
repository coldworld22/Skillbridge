import { useState } from "react";
import { motion } from "framer-motion";
import { FaUpload, FaTrash } from "react-icons/fa";
import styles from "./InstructorDetails.module.scss";

const InstructorDetails = ({ formData, setFormData, nextStep, prevStep }) => {
  const [errors, setErrors] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({
    courseCertificate: null,
    universityCertificate: null,
    experienceCertificate: null,
    additionalDocs: [],
  });

  // ✅ Handle Input Change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      instructorDetails: {
        ...formData.instructorDetails,
        [e.target.name]: e.target.value,
      },
    });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  // ✅ Handle Multiple File Uploads
  const handleFileUpload = (e, docType) => {
    const file = e.target.files[0];
    if (file) {
      if (docType === "additionalDocs") {
        setUploadedFiles((prev) => ({
          ...prev,
          additionalDocs: [...prev.additionalDocs, file.name],
        }));
      } else {
        setUploadedFiles((prev) => ({
          ...prev,
          [docType]: file.name,
        }));
      }
    }
  };

  // ✅ Remove File
  const removeFile = (docType, index = null) => {
    if (docType === "additionalDocs") {
      setUploadedFiles((prev) => ({
        ...prev,
        additionalDocs: prev.additionalDocs.filter((_, i) => i !== index),
      }));
    } else {
      setUploadedFiles((prev) => ({
        ...prev,
        [docType]: null,
      }));
    }
  };

  // ✅ Validate Form Fields
  const validateForm = () => {
    let newErrors = {};
    if (!formData.instructorDetails.experience) newErrors.experience = "Experience is required";
    if (!formData.instructorDetails.certifications) newErrors.certifications = "Certifications are required";
    if (!uploadedFiles.courseCertificate) newErrors.courseCertificate = "Upload a Course Certificate";
    if (!uploadedFiles.universityCertificate) newErrors.universityCertificate = "Upload a University Certificate";
    if (!uploadedFiles.experienceCertificate) newErrors.experienceCertificate = "Upload an Experience Certificate";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className={styles.title}>Instructor Verification</h2>

      {/* ✅ Teaching Experience */}
      <div className={styles.field}>
        <label className={styles.label}>Years of Teaching Experience</label>
        <input
          type="number"
          name="experience"
          value={formData.instructorDetails.experience}
          onChange={handleChange}
          className={styles.input}
        />
        {errors.experience && <p className={styles.error}>{errors.experience}</p>}
      </div>

      {/* ✅ Certifications */}
      <div className={styles.field}>
        <label className={styles.label}>Certifications</label>
        <input
          type="text"
          name="certifications"
          value={formData.instructorDetails.certifications}
          onChange={handleChange}
          className={styles.input}
        />
        {errors.certifications && <p className={styles.error}>{errors.certifications}</p>}
      </div>

      {/* ✅ Multi-File Uploads */}
      {[
        { label: "Course Certificate", type: "courseCertificate" },
        { label: "University Certificate", type: "universityCertificate" },
        { label: "Experience Certificate", type: "experienceCertificate" },
      ].map(({ label, type }) => (
        <div key={type} className={styles.uploadBlock}>
          <label className={styles.label}>{label}:</label>
          <div className={styles.uploadRow}>
            <FaUpload className={styles.icon} />
            <label htmlFor={type} className={styles.uploadLabel}>
              {uploadedFiles[type] ? uploadedFiles[type] : "Click to Upload"}
            </label>
            <input
              id={type}
              type="file"
              className={styles.hiddenInput}
              onChange={(e) => handleFileUpload(e, type)}
            />
          </div>
          {uploadedFiles[type] && (
            <button
              className={styles.remove}
              onClick={() => removeFile(type)}
              type="button"
            >
              <FaTrash /> Remove
            </button>
          )}
          {errors[type] && <p className={styles.error}>{errors[type]}</p>}
        </div>
      ))}

      {/* ✅ Additional Documents Upload */}
      <div className={styles.uploadBlock}>
        <label className={styles.label}>Additional Supporting Documents:</label>
        <div className={styles.uploadRow}>
          <FaUpload className={styles.icon} />
          <label htmlFor="additionalDocs" className={styles.uploadLabel}>
            Click to Upload
          </label>
          <input
            id="additionalDocs"
            type="file"
            className={styles.hiddenInput}
            onChange={(e) => handleFileUpload(e, "additionalDocs")}
          />
        </div>
        {uploadedFiles.additionalDocs.length > 0 &&
          uploadedFiles.additionalDocs.map((doc, index) => (
            <div key={index} className={styles.docItem}>
              <span>{doc}</span>
              <button
                className={styles.remove}
                onClick={() => removeFile("additionalDocs", index)}
                type="button"
              >
                <FaTrash /> Remove
              </button>
            </div>
          ))}
      </div>

      {/* ✅ Available Teaching Hours */}
      <div className={styles.field}>
        <label className={styles.label}>Available Teaching Hours (per week)</label>
        <input
          type="text"
          name="availability"
          value={formData.instructorDetails.availability}
          onChange={handleChange}
          className={styles.input}
        />
      </div>

      {/* ✅ Course Pricing */}
      <div className={styles.field}>
        <label className={styles.label}>Course Pricing ($ per course)</label>
        <input
          type="text"
          name="pricing"
          value={formData.instructorDetails.pricing}
          onChange={handleChange}
          className={styles.input}
        />
      </div>

      {/* ✅ Navigation Buttons */}
      <div className={styles.actions}>
        <button
          className={`${styles.button} ${styles.back}`}
          onClick={prevStep}
          type="button"
        >
          Back
        </button>
        <button
          className={`${styles.button} ${styles.next}`}
          onClick={() => validateForm() && nextStep()}
          type="button"
        >
          Next
        </button>
      </div>
    </motion.div>
  );
};

export default InstructorDetails;
