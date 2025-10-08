// components/student/instructors/InstructorFilters.js
import { FaSearch } from "react-icons/fa";

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
  setOnlyAvailable
}) {
  return (
    <div className="flex flex-wrap gap-4 mb-8">
      <div className="relative w-full max-w-xs">
        <input
          type="text"
          placeholder="Search instructors..."
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
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      <select
        className="p-3 border border-gray-300 rounded-lg"
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
      >
        {sortOptions.map((opt) => (
          <option key={opt}>{opt}</option>
        ))}
      </select>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={onlyAvailable}
          onChange={(e) => setOnlyAvailable(e.target.checked)}
        />
        Only Available
      </label>
    </div>
  );
}
