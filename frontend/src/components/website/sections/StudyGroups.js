import { useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaFilter, FaPlus } from "react-icons/fa";

const categories = [
  {
    id: 1,
    name: "Medicine & Healthcare",
    icon: "🏥",
    image: "https://i.pinimg.com/736x/5e/6b/1c/5e6b1c6a633aeeaa013312b69c89ab11.jpg",
    children: [
      { name: "Nursing", count: 7 },
      { name: "Dentistry", count: 3 },
    ]
  },
  {
    id: 2,
    name: "Engineering & Technology",
    icon: "⚙️",
    image: "https://static.vecteezy.com/system/resources/previews/002/949/141/non_2x/programming-code-coding-or-hacker-background-vector.jpg",
    children: [
      { name: "Python", count: 5 },
      { name: "Web Development", count: 4 }
    ]
  },
  {
    id: 3,
    name: "Business & Finance",
    icon: "💼",
    image: "https://img.freepik.com/free-vector/marketing-strategy-planning-analysis-business-vision-concept_1150-39773.jpg",
    children: [
      { name: "Finance", count: 6 },
      { name: "Marketing", count: 5 }
    ]
  }
];

const GroupLandingPage = () => {
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const router = useRouter();

  const toggle = (i) => setExpanded(expanded === i ? null : i);

  const filtered = categories.filter(cat =>
    cat.name.toLowerCase().includes(search.toLowerCase()) ||
    cat.children.some(sub => sub.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      <section className="py-16 bg-gray-900 text-white text-center">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold mb-6 text-yellow-400">📚 Study Groups</h2>
          <p className="text-lg text-gray-300 mb-8">Explore fields and connect with focused learning communities.</p>

          {/* 🔍 Search */}
          <div className="relative max-w-xl mx-auto mb-8">
            <input
              type="text"
              placeholder="Search by category or topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-3 pl-10 rounded-lg border border-gray-600 focus:ring-2 focus:ring-yellow-500 focus:outline-none text-gray-900"
            />
            <FaFilter className="absolute left-3 top-4 text-gray-500" />
          </div>

          {/* ➕ Create Button */}
          <div className="mb-10 flex justify-center">
            <button
              onClick={() => router.push("/groups/create")}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg transition"
            >
              <FaPlus /> Create Study Group
            </button>
          </div>

          {/* ❌ No Match */}
          {filtered.length === 0 ? (
            <p className="text-gray-400">No matching categories found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.slice(0, showAll ? filtered.length : 3).map((cat, i) => (
                <motion.div
                  key={cat.id}
                  whileHover={{ scale: 1.03 }}
                  onClick={() => toggle(i)}
                  className="bg-gray-800 rounded-xl shadow-lg cursor-pointer transition duration-300 hover:shadow-2xl hover:bg-yellow-500 overflow-hidden"
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="h-36 w-full object-cover"
                  />
                  <div className="p-4 text-center">
                    <h3 className="text-xl font-semibold">{cat.icon} {cat.name}</h3>
                    <p className="text-sm text-yellow-300 mt-1">{cat.children.length} Subcategories</p>
                  </div>

                  <AnimatePresence>
                    {expanded === i && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-700 px-4 py-3 text-left text-sm text-gray-200"
                      >
                        {cat.children.map((child, j) => (
                          <motion.p
                            key={j}
                            className="py-1 hover:text-yellow-400 transition cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/groups/explore?filter=${encodeURIComponent(child.name)}`);
                            }}
                          >
                            • {child.name}{" "}
                            <span className="text-xs text-gray-400">({child.count} groups)</span>
                          </motion.p>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <FaChevronDown
                    className={`mt-2 mb-4 mx-auto text-gray-400 transition-transform ${expanded === i ? "rotate-180" : ""}`}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* 🔽 Show More */}
          {!showAll && filtered.length > 3 && (
            <motion.button
              onClick={() => setShowAll(true)}
              className="mt-10 px-6 py-3 bg-yellow-500 text-gray-900 rounded-lg font-semibold hover:bg-yellow-600 transition shadow-lg"
              whileHover={{ scale: 1.05 }}
            >
              Show More Groups
            </motion.button>
          )}
        </div>
      </section>
    </motion.section>
  );
};

export default GroupLandingPage;
