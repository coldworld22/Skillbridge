import React, { useMemo } from 'react';

const DEFAULT_CATEGORIES = ['Programming', 'Design', 'Business'];

function ClassFilters({ filters, onChange, categories = [] }) {
  const { search, category, date, priceRange } = filters;
  const categoryOptions = useMemo(() => {
    if (!Array.isArray(categories) || categories.length === 0) {
      return DEFAULT_CATEGORIES;
    }
    const unique = Array.from(
      new Set(
        categories
          .map((cat) => (typeof cat === 'string' ? cat.trim() : ''))
          .filter(Boolean)
      )
    );
    return unique.length > 0 ? unique : DEFAULT_CATEGORIES;
  }, [categories]);

  const handleChange = (patch) => {
    onChange({ ...filters, ...patch });
  };

  return (
    <div className="bg-gray-900 p-6 rounded-xl shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-yellow-400">Filter Classes</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Search */}
        <input
          type="text"
          placeholder="Search by title or instructor"
          className="px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none"
          value={search}
          onChange={(e) => handleChange({ search: e.target.value })}
        />

        {/* Category */}
        <select
          value={category}
          onChange={(e) => handleChange({ category: e.target.value })}
          className="px-4 py-2 rounded-lg bg-gray-800 text-white focus:outline-none"
        >
          <option value="">All Categories</option>
          {categoryOptions.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Date */}
        <input
          type="date"
          value={date}
          onChange={(e) => handleChange({ date: e.target.value })}
          className="px-4 py-2 rounded-lg bg-gray-800 text-white focus:outline-none"
        />

        {/* Price */}
        <select
          value={priceRange}
          onChange={(e) => handleChange({ priceRange: e.target.value })}
          className="px-4 py-2 rounded-lg bg-gray-800 text-white focus:outline-none"
        >
          <option value="">All Prices</option>
          <option value="free">Free</option>
          <option value="under50">Under $50</option>
          <option value="over50">Over $50</option>
        </select>
      </div>
    </div>
  );
}

export default ClassFilters;
