// components/student/instructors/InstructorFilters.js
import { FaSearch } from "react-icons/fa";
import { useTranslation } from "next-i18next";

export default function InstructorFilters({
  categories,
  sortOptions,
  selectedCategory,
  setSelectedCategory,
  sortBy,
  setSortBy,
  searchQuery,
  setSearchQuery,
  onlyAvailable,
  setOnlyAvailable,
}) {
  const { t } = useTranslation("dashboard", { keyPrefix: "studentInstructorsPage" });
  return (
    <div className="flex flex-wrap gap-4 mb-8">
      <div className="relative w-full max-w-xs">
        <input
          type="text"
          placeholder={t('search_placeholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 pl-10 rounded-lg border border-gray-300"
        />
        <FaSearch className="absolute left-3 top-4 text-gray-500" />
      </div>

      <select
        className="p-3 border border-gray-300 rounded-lg"
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
      >
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat === 'all' ? t('filter_all') : cat}
          </option>
        ))}
      </select>

      <select
        className="p-3 border border-gray-300 rounded-lg"
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={onlyAvailable}
          onChange={(e) => setOnlyAvailable(e.target.checked)}
        />
        {t('only_available')}
      </label>
    </div>
  );
}
