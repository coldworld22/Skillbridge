import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";

const SearchBar = ({ placeholder }) => {
  const [searchText, setSearchText] = useState("");

  return (
    <div className="relative w-full max-w-lg mx-auto mb-6">
      <input
        type="text"
        placeholder={placeholder}
        className="w-full p-4 text-gray-900 bg-white rounded-lg shadow-lg focus:outline-none"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />
      <FaSearch className="absolute right-4 top-4 text-gray-600 text-xl" />
    </div>
  );
};

export default SearchBar;
