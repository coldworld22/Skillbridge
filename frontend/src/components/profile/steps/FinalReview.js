import { useState } from "react";
import { motion } from "framer-motion";
import { FaArrowLeft, FaCheckCircle, FaUpload, FaExclamationTriangle, FaPlayCircle, FaTrash } from "react-icons/fa";
import logger from "@/utils/logger";
import styles from "./FinalReview.module.scss";

const FinalReview = ({ formData, prevStep }) => {
  const [isAgreed, setIsAgreed] = useState(false);
  const [demoVideo, setDemoVideo] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // ✅ Handle Demo Video Upload with Progress Simulation
  const handleVideoUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // ✅ Validate file type and size (max 100MB)
    if (!file.type.includes("video")) {
      alert("❌ Please upload a valid video file.");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      alert("❌ Video file size should be less than 100MB.");
      return;
    }

    setDemoVideo(file.name);
    setUploadProgress(0);

    // 🔹 Simulating Upload Progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) clearInterval(interval);
    }, 300);
  };

  // ✅ Remove Video
  const removeVideo = () => {
    setDemoVideo(null);
    setUploadProgress(0);
  };

  // ✅ Handle Submission
  const handleSubmit = () => {
    if (!isAgreed) {
      alert("You must agree to the terms & conditions before submitting.");
      return;
    }

    if (formData.role === "instructor" && !demoVideo) {
      alert("Instructors must upload a demo video.");
      return;
    }

    // 🔹 Send to Admin for Approval
    logger.log("🚀 Submitting Profile for Review:", formData);

    // ✅ Mark as Submitted
    setSubmitted(true);

    // 🔹 Send Email Verification (Mock)
    setTimeout(() => {
      alert("📧 Verification email has been sent!");
    }, 1500);
  };

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className={styles.title}>Final Review & Submit</h2>

      {/* ✅ Profile Summary */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>👤 Personal Details</h3>
        <p><strong>Name:</strong> {formData.name}</p>
        <p><strong>Email:</strong> {formData.email}</p>
        <p><strong>Phone:</strong> {formData.phone}</p>
      </div>

      {/* ✅ Role-Specific Details */}
      {formData.role === "instructor" && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>🎓 Instructor Details</h3>
          <p><strong>Expertise:</strong> {formData.instructorDetails.expertise.join(", ")}</p>
          <p><strong>Experience:</strong> {formData.instructorDetails.experience}</p>
          <p><strong>Certifications:</strong> {formData.instructorDetails.certifications}</p>
        </div>
      )}

      {/* ✅ Social Links */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>🔗 Social Links</h3>
        <p><strong>LinkedIn:</strong> {formData.socialLinks?.linkedin || "Not Provided"}</p>
        <p><strong>Portfolio:</strong> {formData.socialLinks?.portfolio || "Not Provided"}</p>
      </div>

      {/* ✅ Demo Video Upload (For Instructors Only) */}
      {formData.role === "instructor" && (
        <div className={styles.demoBlock}>
          <label className={`${styles.sectionTitle} flex items-center gap-2`}>
            <FaUpload className={styles.iconUpload} /> Upload Demo Lesson Video:
          </label>

          {!demoVideo ? (
            <div className={styles.uploadRow}>
              <label htmlFor="videoUpload" className={styles.uploadLabel}>
                Click to Upload
              </label>
              <input 
                id="videoUpload"
                type="file"
                accept="video/*"
                className={styles.hiddenInput}
                onChange={handleVideoUpload}
              />
            </div>
          ) : (
            <div className={styles.videoCard}>
              <span className="flex items-center gap-2">
                <FaPlayCircle className={styles.iconPlay} /> {demoVideo}
              </span>
              <button className={styles.remove} onClick={removeVideo} type="button">
                <FaTrash />
              </button>
            </div>
          )}

          {/* ✅ Upload Progress Bar */}
          {uploadProgress > 0 && (
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
        </div>
      )}

      {/* ✅ Terms & Conditions */}
      <div className={styles.terms}>
        <input
          type="checkbox"
          id="terms"
          checked={isAgreed}
          onChange={() => setIsAgreed(!isAgreed)}
          className={styles.checkbox}
        />
        <label htmlFor="terms">
          I agree to the <a href="#" className="text-yellow-500 underline">Terms & Conditions</a>
        </label>
      </div>

      {/* ✅ Submission Message */}
      {submitted && (
        <div className={styles.submitted}>
          <FaCheckCircle /> Your profile has been submitted for admin review! 🚀
        </div>
      )}

      {/* ✅ Navigation & Submit Buttons */}
      <div className={styles.actions}>
        <button
          className={`${styles.button} ${styles.back}`}
          onClick={prevStep}
          type="button"
        >
          <FaArrowLeft /> Back
        </button>
        <button
          className={`${styles.button} ${isAgreed ? styles.submit : styles.submitDisabled}`}
          onClick={handleSubmit}
          disabled={!isAgreed}
          type="button"
        >
          Submit <FaCheckCircle />
        </button>
      </div>

      {/* ✅ Warning for Admin Approval */}
      <div className={styles.warning}>
        <FaExclamationTriangle />
        Note: Your profile will be **reviewed by an admin** before you can start creating courses.
      </div>
    </motion.div>
  );
};

export default FinalReview;
