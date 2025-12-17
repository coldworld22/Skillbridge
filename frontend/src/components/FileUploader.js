import React, { useState } from "react";
import { FaFileUpload, FaTimes } from "react-icons/fa";
import styles from "./FileUploader.module.scss";

const FileUploader = ({ onFileUpload, onFileRemove }) => {
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState({});

  // Handle file selection
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (!newFiles.length) return;

    setFiles((prev) => [...prev, ...newFiles]);
    newFiles.forEach((file) => simulateUpload(file));
    if (typeof onFileUpload === "function") {
      onFileUpload(newFiles);
    }
  };

  // Simulate file upload progress
  const simulateUpload = (file) => {
    let progressValue = 0;
    const interval = setInterval(() => {
      progressValue += 10;
      setProgress((prev) => ({ ...prev, [file.name]: progressValue }));

      if (progressValue >= 100) {
        clearInterval(interval);
      }
    }, 200);
  };

  // Remove file
  const removeFile = (index) => {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      const removed = prev[index];
      if (removed && typeof onFileRemove === "function") {
        onFileRemove(removed, index);
      }
      return next;
    });
  };

  return (
    <div className={styles.wrapper}>
      <label className={styles.uploadLabel}>
        <FaFileUpload /> Upload Files
        <input type="file" multiple onChange={handleFileChange} className="hidden" />
      </label>

      {/* File Preview & Progress */}
      {files.length > 0 && (
        <div className={styles.list}>
          {files.map((file, index) => (
            <div key={index} className={styles.item}>
              <span>{file.name} ({progress[file.name] || 0}%)</span>
              <button onClick={() => removeFile(index)} className={styles.removeButton}>
                <FaTimes />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
