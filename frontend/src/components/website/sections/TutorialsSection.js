import React, { useState } from "react";
import Link from "next/link";
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

// 👇 You can fetch real progress from backend or localStorage in future
const mockProgress = {
  1: 75,
  2: 40,
  3: 100,
  4: 20,
  5: 0,
  6: 60,
};

const tutorials = [
  {
    id: 1,
    title: "Mastering React.js",
    instructor: "John Doe",
    duration: "30 min",
    level: "Beginner",
    rating: 4.8,
    thumbnail: "https://codemanbd.com/wp-content/uploads/2024/03/Mastering-React-JS.jpg",
    tags: ["Beginner Friendly", "Hands-on"],
    trending: true,
    preview: "https://www.w3schools.com/html/mov_bbb.mp4",
    category: "Frontend"
  },
  {
    id: 2,
    title: "Node.js Full Stack",
    instructor: "Jane Smith",
    duration: "45 min",
    level: "Intermediate",
    rating: 4.2,
    thumbnail: "https://i.ytimg.com/vi/YYmzj5DK_5s/hq720.jpg",
    tags: ["Full Stack"],
    category: "Backend"
  },
  {
    id: 3,
    title: "Deep Learning Basics",
    instructor: "Alan Turing",
    duration: "1h 10m",
    level: "Advanced",
    rating: 5.0,
    thumbnail: "https://i.ytimg.com/vi/bpFjQGCa7Xg/maxresdefault.jpg",
    tags: ["Top Rated"],
    trending: true,
    category: "AI"
  },
  {
    id: 4,
    title: "Responsive Web Design",
    instructor: "Laura Bennett",
    duration: "45 min",
    level: "Beginner",
    rating: 4.5,
    thumbnail: "https://i.ytimg.com/vi/srvUrASNj0s/maxresdefault.jpg",
    tags: ["HTML", "CSS"],
    category: "Design"
  },
  {
    id: 5,
    title: "Docker Essentials",
    instructor: "Mohamed Ali",
    duration: "50 min",
    level: "Intermediate",
    rating: 4.4,
    thumbnail: "https://i.ytimg.com/vi/Gjnup-PuquQ/maxresdefault.jpg",
    tags: ["Containers"],
    category: "DevOps"
  },
  {
    id: 6,
    title: "Git & GitHub Essentials",
    instructor: "Emily Davis",
    duration: "30 min",
    level: "Beginner",
    rating: 4.7,
    thumbnail: "https://i.ytimg.com/vi/apGV9Kg7ics/maxresdefault.jpg",
    tags: ["Git", "Version Control"],
    category: "Tools"
  }
];

const categoryTabs = [
  { label: "All", value: "All", icon: null },
  { label: "Frontend", value: "Frontend", icon: <FaCode /> },
  { label: "Backend", value: "Backend", icon: <FaCubes /> },
  { label: "Design", value: "Design", icon: <FaPaintBrush /> }
];

const getStars = (rating) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <>
      {Array(full).fill().map((_, i) => (
        <FaStar key={i} className="text-yellow-400" />
      ))}
      {half && <FaStar className="text-yellow-300 opacity-50" />}
    </>
  );
};

const LandingTutorialsSection = () => {
  const [activeTab, setActiveTab] = useState("All");
  const router = useRouter();

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
                    style={{ width: `${mockProgress[tut.id] || 0}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Watched: {mockProgress[tut.id] || 0}%
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
