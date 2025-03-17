import { useState, useEffect } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import mockResults from "@/mocks/searchResults.json";

const SearchBar = ({ value, onChange, onSelect }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false); // ✅ NEW STATE: Controls when to show suggestions

  const trendingSearches = ["React for Beginners", "Python AI Bootcamp", "Full Stack Development"];

  useEffect(() => {
    const delay = setTimeout(() => {
      if (value.length > 2) {
        setLoading(true);
        setShowSuggestions(true); // ✅ Show suggestions only when typing

        const searchTerm = value.toLowerCase();

        const filtered = mockResults.filter((item) =>
          item.title.toLowerCase().includes(searchTerm) ||
          item.description.toLowerCase().includes(searchTerm) ||
          (item.category && item.category.toLowerCase().includes(searchTerm))
        );

        setSuggestions(filtered);
        setLoading(false);

        // ✅ Show "No Results" only when user types
        if (filtered.length === 0) {
          setSuggestions([{ id: "no-results", title: "No results found.", isNoResults: true }]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false); // ✅ Hide suggestions if user deletes input
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [value]);

  return (
    <div className="relative w-full">
      <div className="flex items-center bg-white/90 shadow-lg rounded-lg backdrop-blur-lg overflow-hidden border border-gray-300 transition hover:border-blue-400">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="🔍 Search for Courses, Instructors, or Topics..."
          className="w-full p-4 text-gray-900 bg-transparent focus:outline-none placeholder-gray-400"
          onFocus={() => setShowSuggestions(value.length > 2)} // ✅ Show only when typing
        />
        {value && (
          <FaTimes
            className="text-gray-500 cursor-pointer mr-3 hover:text-red-500 transition"
            onClick={() => {
              onChange("");
              setShowSuggestions(false); // ✅ Hide suggestions on clear
            }}
          />
        )}
        <FaSearch className="text-gray-600 text-xl mr-4" />
      </div>

      {/* 🔍 Show Suggestions ONLY when Typing */}
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute top-full left-0 w-full bg-white border shadow-md rounded-md mt-2">
          {suggestions.map((item, index) => (
            <li
              key={item.id}
              className={`p-3 cursor-pointer ${item.isNoResults ? "text-gray-500 cursor-default" : "hover:bg-blue-100"} transition`}
              onClick={() => !item.isNoResults && onSelect(item.title)}
            >
              {item.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
