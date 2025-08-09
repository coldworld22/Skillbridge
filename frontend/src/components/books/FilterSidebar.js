import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaTimesCircle } from "react-icons/fa";
import { fetchBookCategories } from "@/services/bookCategoryService";
import { toast } from "react-toastify";

const BookFilterSidebar = ({ onFilterChange, onResetFilters }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
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

  const handleCategoryChange = (id) => {
    setSelectedCategory(id);
    onFilterChange({ category: id, priceRange });
  };

  const resetFilters = () => {
    setSelectedCategory("");
    setPriceRange(100);
    onResetFilters();
  };

  return (
    <motion.div
      className="bg-gray-800 p-6 rounded-lg shadow-lg w-full"
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
            const value = Number(e.target.value);
            setPriceRange(value);
            onFilterChange({ category: selectedCategory, priceRange: value });
          }}
          className="w-full mt-2"
        />
      </div>

      <div className="mb-6">
        <h3 className="text-gray-300 font-semibold">Category</h3>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        {categories.map((cat) => (
          <label
            key={cat.id}
            className="flex items-center space-x-2 text-gray-300 mt-2"
          >
            <input
              type="radio"
              name="category"
              value={cat.id}
              checked={selectedCategory === cat.id}
              onChange={() => handleCategoryChange(cat.id)}
            />
            <span>{cat.name}</span>
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

