import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "next-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaFilter } from "react-icons/fa";
import * as LucideIcons from "lucide-react";
import { fetchCategoryTree } from "@/services/instructor/categoryService";
import { API_BASE_URL } from "@/config/config";

const FALLBACK_ICON = "FolderKanban";

const normalizeImageUrl = (src) => {
  if (!src) return null;
  if (/^https?:\/\//i.test(src)) return src;
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL || "").replace(
    /\/$/,
    ""
  );
  return `${base}/${src.replace(/^\/+/g, "")}`;
};

const getIconComponent = (iconName) => {
  if (!iconName) return null;
  return LucideIcons[iconName] || null;
};

const renderCategoryAvatar = (category) => {
  const IconComponent = getIconComponent(category?.icon);
  if (IconComponent) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-yellow-400/40 bg-yellow-500/10 text-yellow-400 shadow-lg">
        <IconComponent className="h-7 w-7" aria-hidden="true" />
      </div>
    );
  }

  const fallback = normalizeImageUrl(category?.image_url);
  return (
    <img
      src={fallback || "https://via.placeholder.com/96x96?text=Category"}
      alt={category?.name || "Category"}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = "https://via.placeholder.com/96x96?text=Category";
      }}
      className="h-16 w-16 rounded-full border border-yellow-400/40 object-cover shadow-lg"
    />
  );
};

const renderTree = (nodes, level = 1) =>
  (nodes || []).map((node) => (
    <div key={node.id} style={{ paddingInlineStart: level * 16 }}>
      <p className="py-1 text-sm text-gray-200 transition hover:text-yellow-400">
        {node.name}
      </p>
      {node.children && node.children.length > 0 && (
        <div className="ml-3 border-l border-gray-700/50 pl-3">
          {renderTree(node.children, level + 1)}
        </div>
      )}
    </div>
  ));

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
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchCategoryTree();
        setCategories(data || []);
      } catch (err) {
        console.error("Failed to fetch categories", err);
        setError(t("categories_load_error"));
      }
      setLoading(false);
    };
    load();
  }, [t]);

  const filtered = useMemo(
    () => filterTree(categories, search),
    [categories, search]
  );

  const displayedCategories = useMemo(
    () => (showAll ? filtered : filtered.slice(0, 6)),
    [filtered, showAll]
  );

  const hasMore = filtered.length > 6;

  const toggle = (id) => setExpandedId((current) => (current === id ? null : id));

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

        {loading && (
          <p className="text-center text-gray-400">{t("categories_loading")}</p>
        )}

        {!loading && error && (
          <p className="text-center text-red-400">{error}</p>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="text-gray-400">{t('no_categories')}</p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-8 max-w-6xl mx-auto md:grid-cols-2 lg:grid-cols-3">
            {displayedCategories.map((cat) => (
              <motion.article
                key={cat.id}
                whileHover={{ scale: 1.03 }}
                className="relative flex flex-col overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-800/80 via-gray-800/60 to-gray-900/70 shadow-xl transition hover:border-yellow-500/60"
              >
                <button
                  type="button"
                  onClick={() => toggle(cat.id)}
                  className="flex flex-1 flex-col items-center gap-4 px-6 py-8 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                >
                  <div className="relative">{renderCategoryAvatar(cat)}</div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{cat.name}</h3>
                    <p className="mt-1 text-xs uppercase tracking-wide text-yellow-400/80">
                      {t("categories_children", {
                        count: cat.children?.length || 0,
                      })}
                    </p>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {expandedId === cat.id && cat.children && cat.children.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-gray-700/60 bg-gray-900/80 px-6 py-4 text-left text-sm text-gray-300"
                    >
                      {renderTree(cat.children)}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="absolute bottom-4 right-4 rounded-full bg-gray-900/60 p-2 text-yellow-400 shadow">
                  <FaChevronDown
                    className={`transition-transform ${expandedId === cat.id ? "rotate-180" : ""}`}
                  />
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {!showAll && hasMore && (
          <motion.button
            className="mt-10 px-6 py-3 bg-yellow-500 text-gray-900 font-semibold rounded-full shadow-lg hover:bg-yellow-600 transition"
            onClick={() => setShowAll(true)}
            whileHover={{ scale: 1.05 }}
          >
            {t('show_more_categories')}
          </motion.button>
        )}
        {showAll && hasMore && (
          <motion.button
            className="mt-8 px-6 py-3 border border-yellow-500 text-yellow-400 font-semibold rounded-full shadow-lg hover:bg-yellow-500/10 transition"
            onClick={() => setShowAll(false)}
            whileHover={{ scale: 1.05 }}
          >
            {t("show_less_categories")}
          </motion.button>
        )}
      </section>
    </motion.section>
  );
}
