import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaTimesCircle } from "react-icons/fa";
import { fetchBookCategories } from "@/services/bookCategoryService";
import { toast } from "react-hot-toast";

const BookFilterSidebar = ({ onFilterChange, onResetFilters }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [priceRange, setPriceRange] = useState(100);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchBookCategories();
        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch categories", err);
        setError("Failed to load categories");
        toast.error("Failed to load categories");
      }
    };
    loadCategories();
  }, []);

  const handleCategoryChange = (name) => {
    const updated = selectedCategories.includes(name)
      ? selectedCategories.filter((c) => c !== name)
      : [...selectedCategories, name];
    setSelectedCategories(updated);
    onFilterChange({ categories: updated, levels: selectedLevels, price: priceRange });
  };

  const handleLevelChange = (level) => {
    const updated = selectedLevels.includes(level)
      ? selectedLevels.filter((l) => l !== level)
      : [...selectedLevels, level];
    setSelectedLevels(updated);
    onFilterChange({ categories: selectedCategories, levels: updated, price: priceRange });
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedLevels([]);
    setPriceRange(100);
    onResetFilters();
  };

  return (
    <motion.div
      className="bg-gray-800 p-6 rounded-lg shadow-lg w-64"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-lg font-bold mb-4 text-yellow-400">Filters</h2>

      <div className="mb-6">
        <label className="text-gray-300">Max Price: ${priceRange}</label>
        <input
          type="range"
          min="0"
          max="500"
          value={priceRange}
          onChange={(e) => {
            const value = e.target.value;
            setPriceRange(value);
            onFilterChange({ categories: selectedCategories, levels: selectedLevels, price: value });
          }}
          className="w-full mt-2"
        />
      </div>

      <div className="mb-6">
        <h3 className="text-gray-300 font-semibold">Categories</h3>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        {categories.map((cat) => (
          <label
            key={cat.id || cat.name || cat}
            className="flex items-center space-x-2 text-gray-300 mt-2"
          >
            <input
              type="checkbox"
              value={cat.name || cat}
              checked={selectedCategories.includes(cat.name || cat)}
              onChange={() => handleCategoryChange(cat.name || cat)}
            />
            <span>{cat.name || cat}</span>
          </label>
        ))}
      </div>

      <div className="mb-6">
        <h3 className="text-gray-300 font-semibold">Difficulty Level</h3>
        {["Beginner", "Intermediate", "Advanced"].map((level) => (
          <label
            key={level}
            className="flex items-center space-x-2 text-gray-300 mt-2"
          >
            <input
              type="checkbox"
              value={level}
              checked={selectedLevels.includes(level)}
              onChange={() => handleLevelChange(level)}
            />
            <span>{level}</span>
          </label>
        ))}
      </div>

      <button
        className="bg-red-500 text-white px-4 py-2 rounded-lg w-full mt-4 flex items-center justify-center gap-2 hover:bg-red-600 transition"
        onClick={resetFilters}
      >
        <FaTimesCircle /> Reset Filters
      </button>
    </motion.div>
  );
};

export default BookFilterSidebar;

