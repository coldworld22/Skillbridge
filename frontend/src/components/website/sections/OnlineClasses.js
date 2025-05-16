import { useState } from "react";
import { motion } from "framer-motion";
import {
  FaSearch,
  FaCalendarAlt,
  FaBookOpen,
  FaVideo,
} from "react-icons/fa";
import { useRouter } from "next/router";

// Sample classes
const classes = [
  { id: 1, title: "AI & Machine Learning", instructor: "Dr. Smith", date: "June 10, 2024", category: "Data Science", type: "Recorded", trending: true },
  { id: 2, title: "Front-end Web Development", instructor: "Jane Doe", date: "June 15, 2024", category: "Programming", type: "Live", trending: false },
  { id: 3, title: "Medical Ethics", instructor: "Dr. John", date: "June 12, 2024", category: "Medicine", type: "Recorded", trending: false },
  { id: 4, title: "Cybersecurity Basics", instructor: "David Wilson", date: "June 18, 2024", category: "Cybersecurity", type: "Live", trending: true },
  { id: 5, title: "Blockchain for Beginners", instructor: "Sarah Lee", date: "June 20, 2024", category: "Finance & Blockchain", type: "Recorded", trending: false },
  { id: 6, title: "UX/UI Design Fundamentals", instructor: "Emily Clark", date: "July 1, 2024", category: "Design & Art", type: "Recorded", trending: true },
  { id: 7, title: "Digital Marketing Basics", instructor: "Mike Johnson", date: "July 5, 2024", category: "Marketing & Business", type: "Live", trending: false },
  { id: 8, title: "Full Stack Development", instructor: "Sophie Turner", date: "July 10, 2024", category: "Programming", type: "Recorded", trending: false },
  { id: 9, title: "Advanced Data Science", instructor: "Alan Turing", date: "July 15, 2024", category: "Data Science", type: "Live", trending: true },
  { id: 10, title: "Cloud Computing Essentials", instructor: "David Green", date: "July 20, 2024", category: "Cloud Computing", type: "Recorded", trending: false },
];

// Category options
const categories = ["All", "Trending", "Programming", "Data Science", "Medicine", "Cybersecurity", "Finance & Blockchain", "Design & Art", "Marketing & Business", "Cloud Computing"];

const OnlineClasses = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showLiveClasses, setShowLiveClasses] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const router = useRouter();

  // Filter logic
  const filteredClasses = classes.filter(
    (classItem) =>
      (selectedCategory === "All" ||
        (selectedCategory === "Trending" && classItem.trending) ||
        classItem.category === selectedCategory) &&
      (showLiveClasses ? classItem.type === "Live" : true) &&
      classItem.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load more
  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 6);
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative w-full py-20 text-center bg-gradient-to-b from-gray-800 to-gray-900"
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2 className="text-5xl font-extrabold mb-6 text-yellow-500">
            🚀 Learn Anytime, Anywhere!
          </motion.h2>
          <motion.p className="text-lg text-gray-300 mb-8">
            Find expert-led courses and join live sessions. Choose from{" "}
            <span className="text-yellow-400 font-semibold">Trending, Free, or Best-Selling</span> classes today!
          </motion.p>

          {/* 🔍 Search & Filters */}
          <div className="flex flex-wrap justify-center items-center gap-4 mb-8">
            <div className="relative w-full max-w-lg">
              <input
                type="text"
                placeholder="Search for a class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:outline-none text-gray-900 shadow-lg"
              />
              <FaSearch className="absolute left-3 top-4 text-gray-600 text-xl" />
            </div>

            <select
              className="p-3 border border-gray-300 rounded-lg bg-gray-800 text-white shadow-lg"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <button
              onClick={() => setShowLiveClasses(!showLiveClasses)}
              className={`p-3 rounded-lg shadow-lg transition ${
                showLiveClasses ? "bg-yellow-500 text-gray-900" : "bg-gray-800 text-white"
              }`}
            >
              {showLiveClasses ? "📹 Show All Classes" : "🎥 Show Only Live Classes"}
            </button>
          </div>

          {/* 📚 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredClasses.slice(0, visibleCount).map((classItem) => (
              <motion.div
                key={classItem.id}
                whileHover={{ scale: 1.03 }}
                className="bg-gray-800 p-6 rounded-2xl shadow-xl relative group hover:ring-2 hover:ring-yellow-400 transition-all"
              >
                {classItem.trending && (
                  <span className="absolute top-3 left-3 bg-yellow-500 text-gray-900 px-3 py-1 text-xs font-bold rounded-full shadow-sm">
                    🔥 Trending
                  </span>
                )}
                <span className={`absolute top-3 right-3 px-3 py-1 text-xs font-bold rounded-full ${
                  classItem.type === "Live"
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-green-600 text-white"
                }`}>
                  {classItem.type}
                </span>

                {/* Icon */}
                {classItem.type === "Live" ? (
                  <FaVideo className="text-red-400 text-5xl mb-4 mx-auto" />
                ) : (
                  <FaBookOpen className="text-yellow-400 text-5xl mb-4 mx-auto" />
                )}

                <h3 className="text-xl font-bold mb-1 text-white">{classItem.title}</h3>
                <p className="text-sm text-gray-400">👨‍🏫 {classItem.instructor}</p>
                <p className="text-sm text-gray-400 mt-1 flex items-center justify-center gap-2">
                  <FaCalendarAlt /> {classItem.date}
                </p>
                <p className="text-sm text-gray-500 italic mt-1">{classItem.category}</p>

                <button
                  className="mt-4 bg-yellow-500 text-gray-900 font-semibold px-5 py-2 rounded-lg hover:bg-yellow-600 transition w-full"
                  onClick={() => router.push(`/online-classes/${classItem.id}`)}
                >
                  {classItem.type === "Live" ? "🎥 Join Live" : "📘 View Class"}
                </button>
              </motion.div>
            ))}
          </div>

          {/* 📊 Class Count */}
          <p className="mt-6 text-sm text-gray-400">
            Showing {Math.min(visibleCount, filteredClasses.length)} of {filteredClasses.length} classes
          </p>

          {/* 📍 Load More */}
          {visibleCount < filteredClasses.length && (
            <motion.button
              onClick={handleLoadMore}
              whileHover={{ scale: 1.05 }}
              className="mt-8 px-6 py-3 bg-yellow-500 text-gray-900 text-lg font-bold rounded-lg shadow-lg hover:bg-yellow-600 transition"
            >
              Load More
            </motion.button>
          )}
        </div>
      </motion.section>
    </div>
  );
};

export default OnlineClasses;
