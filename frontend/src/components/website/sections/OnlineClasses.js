import { useState } from "react";
import { motion } from "framer-motion";
import { FaSearch, FaCalendarAlt, FaUserPlus, FaBookOpen } from "react-icons/fa";

// Sample class data
const classes = [
  { id: 1, title: "AI & Machine Learning", instructor: "Dr. Smith", date: "2024-06-10", category: "Data Science" },
  { id: 2, title: "Front-end Web Development", instructor: "Jane Doe", date: "2024-06-15", category: "Programming" },
  { id: 3, title: "Medical Ethics", instructor: "Dr. John", date: "2024-06-12", category: "Medicine" },
  { id: 4, title: "Cybersecurity Basics", instructor: "David Wilson", date: "2024-06-18", category: "Cybersecurity" },
  { id: 5, title: "Blockchain for Beginners", instructor: "Sarah Lee", date: "2024-06-20", category: "Finance & Blockchain" },
  { id: 6, title: "Cloud Computing Essentials", instructor: "Michael Brown", date: "2024-06-22", category: "Technology" },
  { id: 7, title: "Data Science with Python", instructor: "Emily Davis", date: "2024-06-25", category: "Data Science" },
  { id: 8, title: "Deep Learning for AI", instructor: "Robert White", date: "2024-06-28", category: "Data Science" },
];

// List of available categories
const categories = ["All", "Programming", "Data Science", "Medicine", "Cybersecurity", "Finance & Blockchain", "Technology"];

const OnlineClasses = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(6); // Show 6 classes initially

  // Filter classes based on category & search
  const filteredClasses = classes.filter(
    (classItem) =>
      (selectedCategory === "All" || classItem.category === selectedCategory) &&
      classItem.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            Join Ongoing & Upcoming Classes
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg text-gray-300 mb-8"
          >
            Browse and request to join classes in various fields. Connect with experts and expand your knowledge!
          </motion.p>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8">

            {/* Search Input */}
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
          </div>

          {/* Classes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredClasses.slice(0, visibleCount).map((classItem) => (
              <motion.div
                key={classItem.id}
                whileHover={{ scale: 1.05 }}
                className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center text-center"
              >
                <FaBookOpen className="text-yellow-500 text-5xl mb-4" />
                <h3 className="text-xl font-bold mb-2">{classItem.title}</h3>
                <p className="text-gray-400 text-sm">Instructor: {classItem.instructor}</p>
                <p className="text-gray-400 text-sm flex items-center gap-2 mt-2">
                  <FaCalendarAlt /> {classItem.date}
                </p>
                <button
                  className="mt-4 bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-600 transition"
                  onClick={() => alert(`Request to join ${classItem.title} sent!`)}
                >
                  <FaUserPlus /> Request to Join
                </button>
              </motion.div>
            ))}
          </div>

          {/* Show More Button */}
          {visibleCount < filteredClasses.length && (
            <motion.button
              onClick={() => setVisibleCount((prev) => prev + 3)}
              whileHover={{ scale: 1.05 }}
              className="mt-8 px-6 py-3 bg-yellow-500 text-gray-900 text-lg font-bold rounded-lg shadow-lg hover:bg-yellow-600 transition"
            >
              Show More Classes
            </motion.button>
          )}
        </div>
      </section>
    </motion.section>



  );
};

export default OnlineClasses;
