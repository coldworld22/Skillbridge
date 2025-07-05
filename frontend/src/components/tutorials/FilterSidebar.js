import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaChevronDown, FaChevronUp, FaTimesCircle } from "react-icons/fa";
import { fetchCategoryTree } from "@/services/admin/categoryService";

const FilterSidebar = ({ onFilterChange, onResetFilters }) => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [priceRange, setPriceRange] = useState(100);
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Categories fetched from the API
  const [categories, setCategories] = useState({});

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const tree = await fetchCategoryTree();
        const map = {};
        (tree || []).forEach((cat) => {
          map[cat.name] = (cat.children || []).map((c) => c.name);
        });
        setCategories(map);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    loadCategories();
  }, []);

  // Handle Category Selection
  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  // Handle Subcategory Selection
  const handleCategoryChange = (subCategory) => {
    const updatedCategories = selectedCategories.includes(subCategory)
      ? selectedCategories.filter((c) => c !== subCategory)
      : [...selectedCategories, subCategory];

    setSelectedCategories(updatedCategories);
    onFilterChange({ categories: updatedCategories, levels: selectedLevels, price: priceRange });
  };

  // Handle Level Selection
  const handleLevelChange = (level) => {
    const updatedLevels = selectedLevels.includes(level)
      ? selectedLevels.filter((l) => l !== level)
      : [...selectedLevels, level];

    setSelectedLevels(updatedLevels);
    onFilterChange({ categories: selectedCategories, levels: updatedLevels, price: priceRange });
  };

  // Reset Filters
  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedLevels([]);
    setPriceRange(100);
    onResetFilters();
  };

  return (
    <motion.div className="bg-gray-800 p-6 rounded-lg shadow-lg w-64" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
      <h2 className="text-lg font-bold mb-4 text-yellow-400">Filters</h2>

      {/* Price Range */}
      <div className="mb-6">
        <label className="text-gray-300">Max Price: ${priceRange}</label>
        <input
          type="range"
          min="0"
          max="500"
          value={priceRange}
          onChange={(e) => {
            setPriceRange(e.target.value);
            onFilterChange({ categories: selectedCategories, levels: selectedLevels, price: e.target.value });
          }}
          className="w-full mt-2"
        />
      </div>

      {/* Categories & Subcategories */}
      <div className="mb-6">
        <h3 className="text-gray-300 font-semibold">Categories</h3>
        {Object.keys(categories).map((category) => (
          <div key={category} className="mt-2">
            <button className="flex items-center justify-between w-full bg-gray-700 p-2 rounded hover:bg-gray-600" onClick={() => toggleCategory(category)}>
              <span className="text-white">{category}</span>
              {expandedCategory === category ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {expandedCategory === category && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} transition={{ duration: 0.3 }} className="ml-4 mt-2">
                {categories[category].map((subCategory) => (
                  <label key={subCategory} className="flex items-center space-x-2 text-gray-300">
                    <input type="checkbox" value={subCategory} checked={selectedCategories.includes(subCategory)} onChange={() => handleCategoryChange(subCategory)} />
                    <span>{subCategory}</span>
                  </label>
                ))}
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* Difficulty Levels */}
      <div className="mb-6">
        <h3 className="text-gray-300 font-semibold">Difficulty Level</h3>
        {["Beginner", "Intermediate", "Advanced"].map((level) => (
          <label key={level} className="flex items-center space-x-2 text-gray-300 mt-2">
            <input type="checkbox" value={level} checked={selectedLevels.includes(level)} onChange={() => handleLevelChange(level)} />
            <span>{level}</span>
          </label>
        ))}
      </div>

      {/* Reset Button */}
      <button className="bg-red-500 text-white px-4 py-2 rounded-lg w-full mt-4 flex items-center justify-center gap-2 hover:bg-red-600 transition" onClick={resetFilters}>
        <FaTimesCircle /> Reset Filters
      </button>
    </motion.div>
  );
};

export default FilterSidebar;
