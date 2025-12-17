import { useState } from "react";
import { motion } from "framer-motion";
import { FaArrowLeft, FaArrowRight, FaLinkedin, FaGithub, FaTwitter, FaGlobe, FaYoutube } from "react-icons/fa";
import styles from "./SocialLinks.module.scss";

const SocialLinks = ({ formData, setFormData, onNext, onBack }) => {
  const [errors, setErrors] = useState({});

  // ✅ Handle Input Change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      socialLinks: { ...formData.socialLinks, [e.target.name]: e.target.value },
    });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  // Validation removed to allow any text values
  const validateURL = () => {};

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className={styles.title}>Connect Your Social Profiles</h2>
      <p className={styles.subtitle}>Link your professional profiles to enhance credibility.</p>

      {[
        { name: "linkedin", placeholder: "LinkedIn Profile", icon: <FaLinkedin className={styles.iconLinkedIn} /> },
        { name: "github", placeholder: "GitHub Profile", icon: <FaGithub className={styles.iconGithub} /> },
        { name: "twitter", placeholder: "Twitter Profile", icon: <FaTwitter className={styles.iconTwitter} /> },
        { name: "website", placeholder: "Personal Website", icon: <FaGlobe className={styles.iconGreen} /> },
        { name: "youtube", placeholder: "YouTube Channel", icon: <FaYoutube className={styles.iconRed} /> },
      ].map(({ name, placeholder, icon }) => (
        <div key={name} className={styles.field}>
          <label className={styles.label}>{placeholder}</label>
          <div className={styles.inputWrap}>
            {icon}
            <input
              type="text"
              name={name}
              value={formData.socialLinks[name] || ""}
              onChange={handleChange}
              className={styles.input}
              placeholder={`https://your-${name}.com`}
            />
          </div>
          {errors[name] && <p className={styles.error}>{errors[name]}</p>}
        </div>
      ))}

      {/* ✅ Navigation Buttons */}
      <div className={styles.actions}>
        <button
          className={`${styles.button} ${styles.back}`}
          onClick={onBack}
        >
          <FaArrowLeft /> Back
        </button>
        <button
          className={`${styles.button} ${styles.next}`}
          onClick={onNext}
        >
          Next <FaArrowRight />
        </button>
      </div>
    </motion.div>
  );
};

export default SocialLinks;
