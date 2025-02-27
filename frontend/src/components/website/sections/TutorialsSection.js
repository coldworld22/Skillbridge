import { useState } from "react";
import { motion } from "framer-motion";
import { FaSearch, FaPlay, FaFilter } from "react-icons/fa";

// Sample tutorial data
const tutorials = [
  { id: 1, title: "Introduction to React", category: "Web Development", instructor: "Jane Doe", duration: "2h 30m" },
  { id: 2, title: "Data Science with Python", category: "Data Science", instructor: "John Smith", duration: "3h 15m" },
  { id: 3, title: "Machine Learning Basics", category: "AI & ML", instructor: "Sarah Lee", duration: "2h 50m" },
  { id: 4, title: "Digital Marketing 101", category: "Marketing", instructor: "Emily Adams", duration: "2h" },
  { id: 5, title: "Fundamentals of Cybersecurity", category: "Cybersecurity", instructor: "David Wilson", duration: "2h 45m" },
];

const categories = ["All", "Web Development", "Data Science", "AI & ML", "Marketing", "Cybersecurity"];

const TutorialsSection = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter Tutorials
  const filteredTutorials = tutorials.filter((tutorial) =>
    (selectedCategory === "All" || tutorial.category === selectedCategory) &&
    tutorial.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (

    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <section className="py-16 bg-gray-900 text-white text-center">
        <h2 className="text-4xl font-bold mb-8">Explore Tutorials</h2>
        <p className="text-lg text-gray-300 mb-10">Start watching courses in various fields.</p>

        {/* Search & Filter Section */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8">
          {/* Search Bar */}
          <div className="relative w-full max-w-lg">
            <input
              type="text"
              placeholder="Search tutorials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 pl-10 rounded-lg border border-gray-500 focus:ring-2 focus:ring-yellow-500 focus:outline-none text-gray-900"
            />
            <FaSearch className="absolute left-3 top-4 text-gray-600 text-xl" />
          </div>

          {/* Category Dropdown */}
          <select
            className="p-3 border border-gray-500 rounded-lg bg-gray-800 text-white shadow-lg"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Tutorials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {filteredTutorials.map((tutorial) => (
            <motion.div
              key={tutorial.id}
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-gray-800 rounded-lg shadow-lg text-xl font-semibold flex flex-col items-center text-center hover:bg-yellow-500 transition cursor-pointer"
            >
              <FaPlay className="text-yellow-500 text-4xl mb-4" />
              <h3 className="text-lg font-bold">{tutorial.title}</h3>
              <p className="text-sm text-gray-300">{tutorial.category}</p>
              <p className="text-sm text-gray-400">{tutorial.instructor} • {tutorial.duration}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </motion.section>



  );
};

export default TutorialsSection;
