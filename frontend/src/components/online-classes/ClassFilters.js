import React from 'react';
function ClassFilters({ filters, onChange }) {
  const { search, category, date, priceRange } = filters;

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
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />

        {/* Category */}
        <select
          value={category}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
          className="px-4 py-2 rounded-lg bg-gray-800 text-white focus:outline-none"
        >
          <option value="">All Categories</option>
          <option value="programming">Programming</option>
          <option value="design">Design</option>
          <option value="business">Business</option>
        </select>

        {/* Date */}
        <input
          type="date"
          value={date}
          onChange={(e) => onChange({ ...filters, date: e.target.value })}
          className="px-4 py-2 rounded-lg bg-gray-800 text-white focus:outline-none"
        />

        {/* Price */}
        <select
          value={priceRange}
          onChange={(e) => onChange({ ...filters, priceRange: e.target.value })}
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
