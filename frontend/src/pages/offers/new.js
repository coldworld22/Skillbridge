import { useState } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import { FaTag } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createOffer } from "@/services/offerService";

const availableTags = ["Urgent", "LiveClass", "Discount", "Flexible", "OneOnOne"];

const CreateOffer = () => {
  const router = useRouter();
  const [offerType, setOfferType] = useState("student");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createOffer({
        title,
        description,
        budget: price,
        timeframe: duration,
      });
      toast.success("🎉 Offer posted successfully!", { theme: "dark" });
      setTimeout(() => router.push("/offers"), 1800);
    } catch (err) {
      toast.error("Failed to post offer", { theme: "dark" });
    }
  };

  const toggleTag = (tag) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="bg-gray-950 text-white min-h-screen">
      <Navbar />
      <ToastContainer position="top-right" autoClose={3000} />
      <section className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-extrabold text-yellow-400 text-center mb-6">
            📌 Post a New Offer
          </h1>

          <form
            onSubmit={handleSubmit}
            className="bg-gray-800 p-6 rounded-lg shadow-lg"
          >
            {/* Offer Type */}
            <div className="mb-4">
              <label className="block text-white font-bold">I am a:</label>
              <select
                className="w-full p-3 bg-gray-700 text-white rounded-lg mt-2"
                value={offerType}
                onChange={(e) => setOfferType(e.target.value)}
              >
                <option value="student">Student (Looking for a tutor)</option>
                <option value="instructor">Instructor (Offering lessons)</option>
              </select>
            </div>

            {/* Title */}
            <div className="mb-4">
              <label className="block text-white font-bold">Course Title:</label>
              <input
                type="text"
                className="w-full p-3 bg-gray-700 text-white rounded-lg mt-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Duration and Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-white font-bold">Duration:</label>
                <input
                  type="text"
                  className="w-full p-3 bg-gray-700 text-white rounded-lg mt-2"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-white font-bold">Price:</label>
                <input
                  type="text"
                  className="w-full p-3 bg-gray-700 text-white rounded-lg mt-2"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-white font-bold">Description:</label>
              <textarea
                className="w-full p-3 bg-gray-700 text-white rounded-lg mt-2"
                rows="4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              ></textarea>
            </div>

            {/* Tags */}
            <div className="mb-6">
              <label className="block text-white font-bold mb-2">Tags:</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 transition ${
                      tags.includes(tag)
                        ? "bg-yellow-500 text-black"
                        : "bg-gray-600 text-white"
                    }`}
                  >
                    <FaTag /> {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full p-3 bg-yellow-500 text-gray-900 font-bold rounded-lg shadow-lg hover:bg-yellow-600 transition"
            >
              📍 Submit Offer
            </button>
          </form>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default CreateOffer;
1