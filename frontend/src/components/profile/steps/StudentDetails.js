import { useState } from "react";
import { motion } from "framer-motion";
import { FaArrowLeft, FaArrowRight, FaUpload, FaTrash, FaCheckCircle } from "react-icons/fa";
import styles from "./StudentDetails.module.scss";

const StudentDetails = ({ formData, setFormData, nextStep, prevStep }) => {
  const [errors, setErrors] = useState({});
  const [profilePic, setProfilePic] = useState(null);

  // ✅ Handle Input Change
  const handleChange = (e) => {
    setFormData({ 
      ...formData, 
      studentDetails: { 
        ...formData.studentDetails, 
        [e.target.name]: e.target.value 
      }
    });
  };

  // ✅ Handle Profile Picture Upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfilePic(imageUrl);
      setFormData({ 
        ...formData, 
        studentDetails: { 
          ...formData.studentDetails, 
          profilePicture: imageUrl 
        }
      });
    }
  };

  // ✅ Remove Profile Picture
  const removeImage = () => {
    setProfilePic(null);
    setFormData({ 
      ...formData, 
      studentDetails: { 
        ...formData.studentDetails, 
        profilePicture: "" 
      }
    });
  };

  // ✅ Validate Form Fields
  const validateForm = () => {
    let newErrors = {};
    if (!formData.studentDetails.educationLevel) newErrors.educationLevel = "Field of study is required";
    if (!formData.studentDetails.learningGoals) newErrors.learningGoals = "Learning goals are required";

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
      <h2 className={styles.title}>Student Details</h2>

      {/* ✅ Profile Picture Upload */}
      <div className={styles.upload}>
        {profilePic ? (
          <div className={styles.preview}>
            <img src={profilePic} alt="Profile Preview" className={styles.avatar} />
            <button onClick={removeImage} className={styles.remove} type="button">
              <FaTrash />
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

      {/* ✅ Education Level */}
      <div className={styles.field}>
        <label className={styles.label}>Education Level</label>
        <select 
          name="educationLevel" 
          value={formData.studentDetails.educationLevel} 
          onChange={handleChange} 
          className={styles.select}
        >
          <option value="">Select your education level</option>
          <option value="High School">High School</option>
          <option value="Undergraduate">Undergraduate</option>
          <option value="Postgraduate">Postgraduate</option>
          <option value="Other">Other</option>
        </select>
        {errors.educationLevel && <p className={styles.error}>{errors.educationLevel}</p>}
      </div>

      {/* ✅ Learning Goals */}
      <div className={styles.field}>
        <label className={styles.label}>Learning Goals</label>
        <input
          type="text"
          name="learningGoals"
          value={formData.studentDetails.learningGoals}
          onChange={handleChange}
          className={styles.input}
        />
        {errors.learningGoals && <p className={styles.error}>{errors.learningGoals}</p>}
      </div>

      {/* ✅ Preferred Learning Style */}
      <div className={styles.field}>
        <label className={styles.label}>Preferred Learning Style</label>
        <select 
          name="learningStyle" 
          value={formData.studentDetails.learningStyle} 
          onChange={handleChange} 
          className={styles.select}
        >
          <option value="">Select your preferred learning style</option>
          <option value="Online">Online</option>
          <option value="In-person">In-person</option>
          <option value="Hybrid">Hybrid</option>
        </select>
      </div>

      {/* ✅ Study Schedule */}
      <div className={styles.field}>
        <label className={styles.label}>Preferred Study Schedule</label>
        <input
          type="text"
          name="studySchedule"
          value={formData.studentDetails.studySchedule}
          onChange={handleChange}
          placeholder="e.g., Evenings, Weekends"
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
          <FaArrowLeft /> Back
        </button>
        <button
          className={`${styles.button} ${styles.next}`}
          onClick={() => validateForm() && nextStep()}
          type="button"
        >
          Next <FaArrowRight />
        </button>
      </div>
    </motion.div>
  );
};

export default StudentDetails;
