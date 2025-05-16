import { useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaFilter } from "react-icons/fa";

const slugify = (text) =>
  text.toLowerCase().replace(/[^\w ]+/g, "").replace(/ +/g, "-");

const categories = [
  {
    name: "Engineering & Technology",
    icon: "⚙️",
    count: 15,
    type: "tutorial",
    subcategories: [
      { name: "Mechanical Engineering", type: "tutorial" },
      {
        name: "Electrical Engineering",
        type: "class",
        children: [
          { name: "Power Systems", type: "class" },
          { name: "Telecommunications", type: "class" },
        ],
      },
      {
        name: "Software Engineering",
        type: "tutorial",
        children: [
          { name: "Frontend", type: "tutorial" },
          { name: "Backend", type: "tutorial" },
        ],
      },
    ],
  },
  {
    name: "Medicine & Healthcare",
    icon: "🏥",
    count: 12,
    type: "class",
    subcategories: [
      { name: "General Medicine", type: "class" },
      { name: "Nursing", type: "class" },
      { name: "Medical Research", type: "tutorial" },
    ],
  },
  {
    name: "Business & Finance",
    icon: "💼",
    count: 20,
    type: "tutorial",
    subcategories: [
      { name: "Marketing", type: "tutorial" },
      {
        name: "Finance",
        type: "tutorial",
        children: [
          { name: "Corporate Finance", type: "tutorial" },
          { name: "Accounting", type: "tutorial" },
        ],
      },
    ],
  },
];

const renderSubcategories = (items, router, level = 1) => {
  return items.map((item, idx) => (
    <div key={idx} className={`pl-${level * 4}`}>
      <p
        className="py-1 hover:text-yellow-400 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          const target = item.type === "class" ? "classes" : "tutorials";
          router.push(`/${target}?filter=${encodeURIComponent(item.name)}`);
        }}
        title={`Browse ${item.name}`}
      >
        {item.name}
        <span className="ml-2 text-xs text-yellow-300 font-medium">{item.type === "class" ? "🎥 Class" : "📚 Tutorial"}</span>
      </p>
      {item.children && (
        <div className="ml-2 border-l border-gray-600 pl-3">
          {renderSubcategories(item.children, router, level + 1)}
        </div>
      )}
    </div>
  ));
};

const StudyCategories = () => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const router = useRouter();

  const toggleCategory = (index) => {
    setExpandedCategory(expandedCategory === index ? null : index);
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.subcategories.some((sub) =>
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.children &&
        sub.children.some((child) =>
          child.name.toLowerCase().includes(searchQuery.toLowerCase())
        ))
    )
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <section className="relative py-20 bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white text-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('/mock/world-map.svg')] bg-cover opacity-5 pointer-events-none"></div>

        <h2 className="text-4xl font-bold mb-2">Explore Study Categories</h2>
        <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
          Discover thousands of disciplines across engineering, healthcare, business, and more—empowering learners everywhere.
        </p>

        <div className="relative max-w-2xl mx-auto mb-10">
          <input
            type="text"
            placeholder="Search categories (e.g., AI, Nursing, Marketing)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-4 pl-12 rounded-full bg-white text-gray-900 border border-gray-300 shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <FaFilter className="absolute left-4 top-4 text-gray-400 text-xl" />
        </div>

        {filteredCategories.length === 0 && (
          <p className="text-gray-400">No categories found matching your search.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {filteredCategories.slice(0, showAll ? filteredCategories.length : 6).map((category, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className="relative bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-yellow-400 transition"
              onClick={() => toggleCategory(index)}
            >
              <div className="p-6">
                <div className="text-5xl mb-2">{category.icon}</div>
                <h3 className="text-xl font-semibold text-white">{category.name}</h3>
                <p className="text-sm text-yellow-200">{category.count} {category.type === "class" ? "Classes" : "Tutorials"}</p>
              </div>
              <AnimatePresence>
                {expandedCategory === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-700 px-6 py-4 text-left text-sm text-gray-300"
                  >
                    {renderSubcategories(category.subcategories, router)}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="absolute bottom-4 right-4">
                <FaChevronDown className={`transition-transform ${expandedCategory === index ? "rotate-180" : ""}`} />
              </div>
            </motion.div>
          ))}
        </div>

        {!showAll && filteredCategories.length > 6 && (
          <motion.button
            className="mt-10 px-6 py-3 bg-yellow-500 text-gray-900 font-semibold rounded-full shadow-lg hover:bg-yellow-600 transition"
            onClick={() => setShowAll(true)}
            whileHover={{ scale: 1.05 }}
          >
            Show More Categories
          </motion.button>
        )}
      </section>
    </motion.section>
  );
};

export default StudyCategories;
