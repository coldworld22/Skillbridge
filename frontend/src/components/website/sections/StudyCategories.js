import { useState, useEffect } from "react";
import { useTranslation } from "next-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaFilter } from "react-icons/fa";
import { fetchCategoryTree } from "@/services/instructor/categoryService";
import { API_BASE_URL } from "@/config/config";

const renderTree = (nodes, level = 1) => {
  return (nodes || []).map((node) => (
    <div key={node.id} className={`pl-${level * 4}`}>
      <p className="py-1 hover:text-yellow-400 cursor-default">{node.name}</p>
      {node.children && node.children.length > 0 && (
        <div className="ml-2 border-l border-gray-600 pl-3">
          {renderTree(node.children, level + 1)}
        </div>
      )}
    </div>
  ));
};

const filterTree = (nodes, query) => {
  if (!query) return nodes;
  const q = query.toLowerCase();
  return (nodes || [])
    .map((n) => {
      const children = filterTree(n.children, query);
      if (n.name.toLowerCase().includes(q) || (children && children.length)) {
        return { ...n, children };
      }
      return null;
    })
    .filter(Boolean);
};

export default function StudyCategories() {
  const { t } = useTranslation("website");
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchCategoryTree();
        setCategories(data || []);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    load();
  }, []);

  const filtered = filterTree(categories, search);

  const toggle = (i) => setExpanded(expanded === i ? null : i);

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <section className="relative py-20 bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white text-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('/mock/world-map.svg')] bg-cover opacity-5 pointer-events-none" />

        <h2 className="text-4xl font-bold mb-2">{t('study_categories_heading')}</h2>
        <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
          {t('study_categories_text')}
        </p>

        <div className="relative max-w-2xl mx-auto mb-10">
          <input
            type="text"
            placeholder={t('search_categories_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-4 pl-12 rounded-full bg-white text-gray-900 border border-gray-300 shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <FaFilter className="absolute left-4 top-4 text-gray-400 text-xl" />
        </div>

        {filtered.length === 0 && (
          <p className="text-gray-400">{t('no_categories')}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {filtered.slice(0, showAll ? filtered.length : 6).map((cat, i) => (
            <motion.div
              key={cat.id}
              whileHover={{ scale: 1.05 }}
              className="relative bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-yellow-400 transition"
              onClick={() => toggle(i)}
            >
              <div className="p-6">
                {cat.image_url && (
                  <img
                    src={`${API_BASE_URL}${cat.image_url}`}
                    alt={cat.name}
                    className="w-16 h-16 rounded-full mx-auto mb-2 object-cover"
                  />
                )}
                <h3 className="text-xl font-semibold text-white">{cat.name}</h3>
              </div>
              <AnimatePresence>
                {expanded === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-700 px-6 py-4 text-left text-sm text-gray-300"
                  >
                    {renderTree(cat.children)}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="absolute bottom-4 right-4">
                <FaChevronDown className={`transition-transform ${expanded === i ? 'rotate-180' : ''}`} />
              </div>
            </motion.div>
          ))}
        </div>

        {!showAll && filtered.length > 6 && (
          <motion.button
            className="mt-10 px-6 py-3 bg-yellow-500 text-gray-900 font-semibold rounded-full shadow-lg hover:bg-yellow-600 transition"
            onClick={() => setShowAll(true)}
            whileHover={{ scale: 1.05 }}
          >
            {t('show_more_categories')}
          </motion.button>
        )}
      </section>
    </motion.section>
  );
}
