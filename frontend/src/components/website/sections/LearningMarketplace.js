import { useState } from "react";
import { motion } from "framer-motion";
import { FaSearch, FaPlus, FaUserGraduate, FaMoneyBillWave, FaClock, FaBookOpen, FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";

// Sample ads data
const ads = [
  { id: 1, type: "Looking for Tutor", title: "Python Basics", user: "John Doe", budget: 50, date: "2024-06-10", category: "Programming" },
  { id: 2, type: "Offering a Class", title: "AI & ML Masterclass", user: "Dr. Smith", budget: 200, date: "2024-06-15", category: "Data Science" },
  { id: 3, type: "Looking for Tutor", title: "Medical Terminology", user: "Anna Kim", budget: 30, date: "2024-06-12", category: "Medicine" },
  { id: 4, type: "Offering a Class", title: "Ethical Hacking", user: "CyberSec Pro", budget: 100, date: "2024-06-18", category: "Cybersecurity" },
  { id: 5, type: "Looking for Tutor", title: "Data Science Crash Course", user: "Alice Smith", budget: 80, date: "2024-06-20", category: "Data Science" },
  { id: 6, type: "Offering a Class", title: "Full Stack Web Development", user: "Chris Evans", budget: 250, date: "2024-06-25", category: "Programming" },
  { id: 7, type: "Looking for Tutor", title: "Blockchain Development", user: "Michael Johnson", budget: 75, date: "2024-06-22", category: "Finance & Blockchain" },
  { id: 8, type: "Offering a Class", title: "Advanced Python", user: "Emma Watson", budget: 150, date: "2024-06-30", category: "Programming" },
];

// List of available categories
const categories = ["All", "Programming", "Data Science", "Medicine", "Cybersecurity", "Finance & Blockchain"];
const sortOptions = [
  { value: "dateAsc", label: "Upcoming Classes" },
  { value: "priceLow", label: "Lowest Price" },
  { value: "priceHigh", label: "Highest Price" },
];

const LearningMarketplace = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("dateAsc");
  const [visibleCount, setVisibleCount] = useState(6); // Show first 6 ads

  // **Filtering & Sorting Logic**
  let filteredAds = ads
    .filter((ad) =>
      (selectedCategory === "All" || ad.category === selectedCategory) &&
      ad.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOption === "dateAsc") return new Date(a.date) - new Date(b.date);
      if (sortOption === "priceLow") return a.budget - b.budget;
      if (sortOption === "priceHigh") return b.budget - a.budget;
      return 0;
    });

  return (

    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <section className="relative w-full py-20 bg-gray-900 text-white text-center">
        <div className="max-w-7xl mx-auto px-6">

          {/* Section Heading */}
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-extrabold mb-6 text-yellow-500"
          >
            Learning Marketplace – Find or Offer Classes
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg text-gray-300 mb-8"
          >
            Browse learning ads, find tutors, or post your own class offering.
          </motion.p>

          {/* 🔍 **Filters & Search** */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8">

            {/* Search Input */}
            <div className="relative w-full max-w-lg">
              <input
                type="text"
                placeholder="Search ads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:outline-none text-gray-900 shadow-lg"
              />
              <FaSearch className="absolute left-3 top-4 text-gray-600 text-xl" />
            </div>

            {/* Category Dropdown */}
            <select
              className="p-3 border border-gray-300 rounded-lg bg-gray-800 text-white shadow-lg"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              className="p-3 border border-gray-300 rounded-lg bg-gray-800 text-white shadow-lg"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            {/* Post Ad Button */}
            <button className="bg-yellow-500 text-gray-900 px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-yellow-600 transition">
              <FaPlus /> Post an Ad
            </button>
          </div>

          {/* 📢 **Ads Grid (Show 6 Initially)** */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAds.slice(0, visibleCount).map((ad) => (
              <motion.div
                key={ad.id}
                whileHover={{ scale: 1.05 }}
                className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center text-center"
              >
                <div className="text-yellow-500 text-5xl mb-4">
                  {ad.type === "Looking for Tutor" ? <FaUserGraduate /> : <FaBookOpen />}
                </div>
                <h3 className="text-xl font-bold mb-2">{ad.title}</h3>
                <p className="text-gray-400 text-sm">Posted by: {ad.user}</p>
                <p className="text-gray-400 text-sm flex items-center gap-2 mt-2">
                  <FaMoneyBillWave /> ${ad.budget}/hr
                </p>
                <p className="text-gray-400 text-sm flex items-center gap-2 mt-2">
                  <FaClock /> {ad.date}
                </p>
                <button className="mt-4 bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-600 transition">
                  <FaUserGraduate /> Contact
                </button>
              </motion.div>
            ))}
          </div>

          {/* Show More Button (if more ads exist) */}
          {visibleCount < filteredAds.length && (
            <motion.button whileHover={{ scale: 1.05 }} className="mt-8 px-8 py-3 bg-yellow-500 text-gray-900 text-lg font-bold rounded-lg shadow-lg hover:bg-yellow-600 transition"
              onClick={() => setVisibleCount(visibleCount + 6)}
            >
              Show More Ads
            </motion.button>
          )}
        </div>
      </section>
    </motion.section>



  );
};

export default LearningMarketplace;
