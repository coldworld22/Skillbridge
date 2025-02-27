import { useState } from "react";
import { motion } from "framer-motion";
import { FaUsers, FaPlus, FaSearch, FaLock, FaUnlock } from "react-icons/fa";

// Sample study groups data
const groups = [
  { id: 1, name: "AI Enthusiasts", category: "Programming", members: 120, isPrivate: false },
  { id: 2, name: "Medical Scholars", category: "Medicine", members: 85, isPrivate: true },
  { id: 3, name: "Business Masterminds", category: "Business", members: 60, isPrivate: false },
  { id: 4, name: "Cybersecurity Experts", category: "Cybersecurity", members: 95, isPrivate: true },
];

// List of available categories
const categories = ["All", "Programming", "Medicine", "Business", "Cybersecurity"];

const StudyGroups = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  // Filter groups based on category & search
  const filteredGroups = groups.filter(
    (group) =>
      (selectedCategory === "All" || group.category === selectedCategory) &&
      group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (

    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <section className="py-16 bg-gray-900 text-white text-center">
        <h2 className="text-4xl font-bold mb-6 text-yellow-500">Join a Study Group</h2>
        <p className="text-lg text-gray-300 mb-8">
          Connect with students and professionals in your field to collaborate and study together.
        </p>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8">
          {/* Search Input */}
          <div className="relative w-full max-w-lg">
            <input
              type="text"
              placeholder="Search study groups..."
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
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          {/* Create Group Button */}
          <button className="bg-yellow-500 text-gray-900 px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-yellow-600 transition">
            <FaPlus /> Create Group
          </button>
        </div>

        {/* Study Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {filteredGroups.slice(0, showAll ? filteredGroups.length : 3).map((group) => (
            <motion.div
              key={group.id}
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-gray-800 rounded-lg shadow-lg text-center flex flex-col items-center hover:bg-yellow-500 transition"
            >
              <FaUsers className="text-yellow-500 text-4xl mb-3" />
              <h3 className="text-xl font-semibold">{group.name}</h3>
              <p className="text-gray-300 text-sm">{group.category}</p>
              <p className="text-gray-400 text-sm">{group.members} Members</p>

              {/* Join / Request Button */}
              <button
                className="mt-4 bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-600 transition"
                onClick={() => alert(`Request sent to join "${group.name}"!`)}
              >
                {group.isPrivate ? <FaLock /> : <FaUnlock />}
                {group.isPrivate ? "Request to Join" : "Join Now"}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Show More Button */}
        {!showAll && (
          <motion.button
            className="mt-6 px-6 py-3 bg-yellow-500 text-gray-900 rounded-lg font-semibold hover:bg-yellow-600 transition shadow-lg"
            onClick={() => setShowAll(true)}
          >
            Show More Groups
          </motion.button>
        )}
      </section>
    </motion.section>



  );
};

export default StudyGroups;
