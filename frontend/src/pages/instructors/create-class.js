import { useState } from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";

const CreateLiveClass = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    price: "",
    resources: [],
  });

  const [successMessage, setSuccessMessage] = useState("");

  // Handle form input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData({ ...formData, resources: [...formData.resources, ...files] });
  };

  // Simulate form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Class Created:", formData);
    setSuccessMessage("✅ Class created successfully!");
    setTimeout(() => setSuccessMessage(""), 3000); // Auto-clear message
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-yellow-400">🎓 Create a Live Class</h1>

        {/* Success Message */}
        {successMessage && (
          <p className="bg-green-500 text-white p-3 rounded-lg mt-4">{successMessage}</p>
        )}

        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg mt-6 shadow-lg">
          {/* Class Title */}
          <div className="mb-4">
            <label className="block text-yellow-400">Class Title:</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full p-2 bg-gray-700 text-white rounded-lg focus:outline-none"
            />
          </div>

          {/* Class Description */}
          <div className="mb-4">
            <label className="block text-yellow-400">Class Description:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              className="w-full p-2 bg-gray-700 text-white rounded-lg focus:outline-none"
            />
          </div>

          {/* Class Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-yellow-400">Class Date:</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full p-2 bg-gray-700 text-white rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-yellow-400">Class Time:</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                className="w-full p-2 bg-gray-700 text-white rounded-lg focus:outline-none"
              />
            </div>
          </div>

          {/* Class Price */}
          <div className="mb-4">
            <label className="block text-yellow-400">Class Price ($):</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              className="w-full p-2 bg-gray-700 text-white rounded-lg focus:outline-none"
            />
          </div>

          {/* Upload Resources */}
          <div className="mb-4">
            <label className="block text-yellow-400">Upload Resources (PDF, PPT, etc.):</label>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="w-full p-2 bg-gray-700 text-white rounded-lg focus:outline-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="bg-yellow-500 text-gray-900 px-6 py-3 rounded-lg hover:bg-yellow-600 transition font-bold w-full mt-4"
          >
            🚀 Create Live Class
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default CreateLiveClass;
