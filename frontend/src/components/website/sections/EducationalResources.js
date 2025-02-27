import { useState } from "react";
import { motion } from "framer-motion";
import { FaDownload, FaBookmark, FaFilePdf } from "react-icons/fa";

// Dummy Resource Data
const resources = [
  {
    id: 1,
    title: "AI & Machine Learning Basics",
    category: "Artificial Intelligence",
    file: "/resources/ai-guide.pdf",
  },
  {
    id: 2,
    title: "Mastering Web Development",
    category: "Web Development",
    file: "/resources/web-dev.pdf",
  },
  {
    id: 3,
    title: "Data Science Essentials",
    category: "Data Science",
    file: "/resources/data-science.pdf",
  },
  {
    id: 4,
    title: "Cybersecurity Fundamentals",
    category: "Cybersecurity",
    file: "/resources/cybersecurity.pdf",
  },
];

const categories = ["All Categories", "Artificial Intelligence", "Web Development", "Data Science", "Cybersecurity"];

const EducationalResources = () => {
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  // Filter Resources by Category
  const filteredResources =
    selectedCategory === "All Categories"
      ? resources
      : resources.filter((resource) => resource.category === selectedCategory);

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <section className="py-16 bg-gray-900 text-white text-center">
        <h2 className="text-4xl font-bold mb-6">Educational Resources 📚</h2>
        <p className="text-lg text-gray-400 mb-10">Download learning materials to enhance your skills.</p>

        {/* Category Filter */}
        <div className="flex justify-center gap-4 mb-8">
          {categories.map((category) => (
            <motion.button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg transition ${selectedCategory === category ? "bg-yellow-500 text-gray-900" : "bg-gray-800 text-white hover:bg-gray-700"
                }`}
              whileHover={{ scale: 1.05 }}
            >
              {category}
            </motion.button>
          ))}
        </div>

        {/* Resource Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {filteredResources.map((resource) => (
            <motion.div
              key={resource.id}
              className="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2"
              whileHover={{ scale: 1.03 }}
            >
              <div className="text-yellow-500 text-4xl mb-4 flex justify-center">
                <FaFilePdf />
              </div>
              <h3 className="text-xl font-semibold">{resource.title}</h3>
              <p className="text-gray-400 mb-4">{resource.category}</p>
              <div className="flex justify-center gap-4">
                <a
                  href={resource.file}
                  download
                  className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg font-semibold hover:bg-yellow-600 transition shadow-lg flex items-center gap-2"
                >
                  <FaDownload /> Download
                </a>
                <button className="px-4 py-2 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition shadow-lg flex items-center gap-2">
                  <FaBookmark /> Save
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </motion.section>



  );
};

export default EducationalResources;
