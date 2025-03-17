import { useState } from "react";
import { motion } from "framer-motion";
import { FaUpload, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

export default function AIFeedback() {
  const [file, setFile] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = (event) => {
    setFile(event.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/ai-feedback", {
      method: "POST",
      body: formData,
    });
    
    const data = await response.json();
    setFeedback(data.feedback);
    setIsSubmitting(false);
  };

  return (
    <div className="p-10 bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">🔍 AI-Powered Feedback</h1>
      <p className="mt-4 text-lg text-gray-300">Submit your assignment and get AI-generated feedback.</p>
      
      <div className="mt-6 bg-gray-800 p-6 rounded-lg shadow-lg text-center max-w-xl w-full">
        <label className="block mb-4 cursor-pointer p-4 border border-dashed border-gray-500 rounded-lg text-gray-300 hover:bg-gray-700 transition">
          <FaUpload className="inline-block text-yellow-500 mr-2" /> Upload Assignment
          <input type="file" className="hidden" onChange={handleFileUpload} />
        </label>
        {file && <p className="text-gray-400">📄 {file.name}</p>}
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          disabled={!file || isSubmitting}
          onClick={handleSubmit}
          className="mt-4 px-6 py-3 bg-yellow-500 text-gray-900 font-semibold text-lg rounded-lg shadow-lg hover:bg-yellow-600 transition w-full disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Get AI Feedback"}
        </motion.button>
      </div>
      
      {feedback && (
        <div className="mt-6 bg-gray-800 p-6 rounded-lg shadow-lg max-w-xl w-full text-left">
          <h2 className="text-2xl font-bold text-yellow-400">Feedback</h2>
          <p className="text-gray-300 mt-2">{feedback}</p>
        </div>
      )}
    </div>
  );
}