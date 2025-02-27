import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaFilter } from "react-icons/fa";

const categories = [
  {
    name: "Medicine & Healthcare",
    icon: "🏥",
    subcategories: ["General Medicine", "Nursing", "Dentistry", "Pharmacy", "Medical Research"]
  },
  {
    name: "Engineering & Technology",
    icon: "⚙️",
    subcategories: ["Mechanical Engineering", "Civil Engineering", "Electrical Engineering", "Robotics", "Software Engineering"]
  },
  {
    name: "Architecture & Design",
    icon: "🏗️",
    subcategories: ["Architectural Design", "Urban Planning", "Interior Design", "Landscape Architecture"]
  },
  {
    name: "Business & Finance",
    icon: "💼",
    subcategories: ["Finance", "Marketing", "Entrepreneurship", "Economics", "Accounting"]
  },
  {
    name: "Law & Political Science",
    icon: "⚖️",
    subcategories: ["International Law", "Human Rights", "Corporate Law", "Political Science"]
  },
  {
    name: "Social Sciences",
    icon: "📚",
    subcategories: ["Psychology", "Sociology", "Anthropology", "History"]
  },
  {
    name: "Arts & Humanities",
    icon: "🎭",
    subcategories: ["Fine Arts", "Music", "Literature", "Philosophy"]
  },
  {
    name: "Environmental & Earth Sciences",
    icon: "🌍",
    subcategories: ["Environmental Science", "Geology", "Meteorology", "Climate Studies"]
  },
];

const StudyCategories = () => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  // Toggle category expansion
  const toggleCategory = (index) => {
    setExpandedCategory(expandedCategory === index ? null : index);
  };

  // Filter categories based on user input
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.subcategories.some((sub) => sub.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (

    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <section className="py-16 bg-gray-900 text-white text-center">
        <h2 className="text-4xl font-bold mb-8">Explore Study Categories</h2>
        <p className="text-lg text-gray-300 mb-10">
          Discover academic disciplines and professional fields worldwide.
        </p>

        {/* 🔎 Search Input */}
        <div className="relative max-w-lg mx-auto mb-8">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 pl-10 rounded-lg border border-gray-500 focus:ring-2 focus:ring-yellow-500 focus:outline-none text-gray-900"
          />
          <FaFilter className="absolute left-3 top-4 text-gray-600 text-xl" />
        </div>

        {/* 📌 Study Category Cards (Show 3 Initially) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {filteredCategories.slice(0, showAll ? filteredCategories.length : 3).map((category, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-gray-800 rounded-lg shadow-lg text-xl font-semibold flex flex-col items-center text-center hover:bg-yellow-500 transition cursor-pointer"
              onClick={() => toggleCategory(index)}
            >
              <span className="text-yellow-500 text-4xl">{category.icon}</span>
              <h3 className="mt-2">{category.name}</h3>

              {/* Subcategories Dropdown */}
              <AnimatePresence>
                {expandedCategory === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 text-gray-300 text-sm bg-gray-700 p-3 rounded-lg w-full"
                  >
                    {category.subcategories.map((sub, subIndex) => (
                      <p key={subIndex} className="py-1 hover:text-yellow-400 cursor-pointer">{sub}</p>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Expand Icon */}
              <FaChevronDown
                className={`mt-2 transition-transform ${expandedCategory === index ? "rotate-180" : ""}`}
              />
            </motion.div>
          ))}
        </div>

        {/* 🔽 Show More Button */}
        {!showAll && (
          <motion.button
            className="mt-6 px-6 py-3 bg-yellow-500 text-gray-900 rounded-lg font-semibold hover:bg-yellow-600 transition shadow-lg"
            onClick={() => setShowAll(true)}
            whileHover={{ scale: 1.05 }}
          >
            Show More
          </motion.button>
        )}
      </section>
    </motion.section>



  );
};

export default StudyCategories;
