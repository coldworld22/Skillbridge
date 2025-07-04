import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  FaStar,
  FaClock,
  FaFire,
  FaBookmark,
  FaCode,
  FaPaintBrush,
  FaCubes,
} from "react-icons/fa";

import { fetchFeaturedTutorials } from "@/services/tutorialService";
const PROGRESS_KEY = "tutorialProgress";

const categoryTabs = [
  { label: "All", value: "All", icon: null },
  { label: "Frontend", value: "Frontend", icon: <FaCode /> },
  { label: "Backend", value: "Backend", icon: <FaCubes /> },
  { label: "Design", value: "Design", icon: <FaPaintBrush /> }
];

const getStars = (rating) => {
  const safeRating = Number.isFinite(rating) && rating > 0 ? rating : 0;
  const full = Math.floor(safeRating);
  const half = safeRating % 1 >= 0.5;
  return (
    <>
      {Array.from({ length: full }).map((_, i) => (
        <FaStar key={i} className="text-yellow-400" />
      ))}
      {half && <FaStar className="text-yellow-300 opacity-50" />}
    </>
  );
};

const LandingTutorialsSection = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [tutorials, setTutorials] = useState([]);
  const [progress, setProgress] = useState({});
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchFeaturedTutorials();
        setTutorials(data || []);
      } catch (err) {
        console.error("Failed to load tutorials", err);
      }
      try {
        const stored = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
        setProgress(stored);
      } catch {
        setProgress({});
      }
    };
    load();
  }, []);

  const filteredTutorials =
    activeTab === "All"
      ? tutorials
      : tutorials.filter((t) => t.category === activeTab);

  return (
    <section className="bg-gray-950 py-16 text-white">
      <motion.h2
        className="text-3xl sm:text-4xl font-bold text-center text-yellow-400 mb-4"
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        📚 Featured Tutorials
      </motion.h2>

      <p className="text-center text-gray-300 mb-10">
        Jumpstart your learning with handpicked tutorials from top instructors.
      </p>

      {/* Category Tabs */}
      <div className="flex justify-center gap-4 flex-wrap mb-8">
        {categoryTabs.map((tab) => (
          <button
            key={tab.value}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
              activeTab === tab.value
                ? "bg-yellow-500 text-black border-yellow-400"
                : "bg-gray-800 text-yellow-300 border-gray-600"
            }`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tutorial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
        {filteredTutorials.map((tut, index) => (
          <motion.div
            key={tut.id}
            whileHover={{ scale: 1.03 }}
            className="bg-gray-800 rounded-lg overflow-hidden shadow-md cursor-pointer relative group"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
            onClick={() => router.push(`/tutorials/${tut.id}`)}
          >
            <div className="relative h-40">
              {tut.preview ? (
                <video
                  src={tut.preview}
                  autoPlay
                  muted
                  loop
                  className="w-full h-full object-cover group-hover:brightness-75"
                />
              ) : (
                <img
                  src={tut.thumbnail}
                  alt={tut.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:brightness-75"
                />
              )}
              {tut.tags.includes("Top Rated") && (
                <span className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 text-xs rounded-full shadow">
                  🔥 Top Rated
                </span>
              )}
              {tut.trending && (
                <span className="absolute top-2 left-2 bg-orange-600 text-white px-2 py-1 text-xs rounded-full shadow">
                  🔥 Trending
                </span>
              )}
              <FaBookmark className="absolute top-2 right-2 text-white bg-gray-700 rounded-full p-1 w-6 h-6 hover:text-yellow-400" />
            </div>

            <div className="p-4">
              <h3 className="font-bold text-yellow-400 text-lg mb-1 truncate">
                {tut.title}
              </h3>
              <p className="text-sm text-gray-300 truncate">
                Instructor: {tut.instructor}
              </p>

              <div className="flex flex-wrap gap-2 mt-2 text-xs">
                <span className="bg-yellow-500 text-black px-2 py-1 rounded-full font-semibold">
                  {tut.level}
                </span>
                {tut.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="bg-gray-700 px-2 py-1 rounded-full text-yellow-300"
                    title={`Tag: ${tag}`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex justify-between mt-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  {getStars(tut.rating)}
                </span>
                <span className="flex items-center gap-1">
                  <FaClock /> {tut.duration}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400"
                    style={{ width: `${progress[tut.id] || 0}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Watched: {progress[tut.id] || 0}%
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Explore Button */}
      <div className="text-center mt-10">
        <motion.a
          href="/tutorials"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-block bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-full font-semibold transition"
        >
          Explore All Tutorials
        </motion.a>
      </div>
    </section>
  );
};

export default LandingTutorialsSection;
