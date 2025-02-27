import React, { useState } from "react";
import { FaFileUpload, FaTimes } from "react-icons/fa";

const FileUploader = ({ onFileUpload }) => {
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState({});

  // Handle file selection
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);

    newFiles.forEach((file) => {
      setFiles((prev) => [...prev, file]);
      simulateUpload(file);
    });
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
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <label className="cursor-pointer bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg flex items-center gap-2">
        <FaFileUpload /> Upload Files
        <input type="file" multiple onChange={handleFileChange} className="hidden" />
      </label>

      {/* File Preview & Progress */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div key={index} className="bg-gray-700 p-3 rounded-lg flex items-center justify-between">
              <span className="text-white">{file.name} ({progress[file.name] || 0}%)</span>
              <button onClick={() => removeFile(index)} className="text-red-500">
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
