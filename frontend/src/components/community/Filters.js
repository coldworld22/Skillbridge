import { useState } from "react";
import { FaFilter, FaChevronDown, FaChevronUp } from "react-icons/fa";

const Filters = ({ onFilterChange }) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState({
    noAnswers: false,
    noAcceptedAnswer: false,
    hasBounty: false,
    sortBy: "Newest",
    tags: "",
  });

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setSelectedFilter((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Apply Filters
  const applyFilter = () => {
    onFilterChange(selectedFilter);
  };

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg shadow-md">
      {/* 🔹 Expand/Collapse Button */}
      <button
        className="flex items-center justify-between w-full bg-gray-700 p-2 rounded-md text-white"
        onClick={() => setIsFilterOpen(!isFilterOpen)}
      >
        <span className="font-bold">Filter Options</span>
        {isFilterOpen ? <FaChevronUp /> : <FaChevronDown />}
      </button>

      {isFilterOpen && (
        <div className="mt-4">
          {/* 🔹 Filter By */}
          <h4 className="text-sm font-semibold mb-1">Filter by:</h4>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="noAnswers"
                checked={selectedFilter.noAnswers}
                onChange={handleChange}
                className="accent-yellow-500"
              />
              No answers
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="noAcceptedAnswer"
                checked={selectedFilter.noAcceptedAnswer}
                onChange={handleChange}
                className="accent-yellow-500"
              />
              No accepted answer
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="hasBounty"
                checked={selectedFilter.hasBounty}
                onChange={handleChange}
                className="accent-yellow-500"
              />
              Has bounty
            </label>
          </div>

          {/* 🔹 Sorting Options */}
          <h4 className="text-sm font-semibold mt-4 mb-1">Sorted by:</h4>
          <select
            name="sortBy"
            value={selectedFilter.sortBy}
            onChange={handleChange}
            className="bg-gray-700 p-2 w-full rounded-md text-white"
          >
            <option value="Newest">Newest</option>
            <option value="Recent Activity">Recent Activity</option>
            <option value="Highest Score">Highest Score</option>
            <option value="Most Frequent">Most Frequent</option>
            <option value="Trending">Trending</option>
          </select>

          {/* 🔹 Apply & Save Buttons */}
          <div className="flex justify-between mt-4">
            <button
              className="bg-yellow-500 text-gray-900 px-4 py-2 rounded-md font-bold hover:bg-yellow-600 transition"
              onClick={applyFilter}
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Filters;
