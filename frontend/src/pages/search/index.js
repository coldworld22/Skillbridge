import { useState, useEffect } from "react";
import SearchBar from "@/components/shared/SearchBar";
import SearchFilters from "@/components/shared/SearchFilters";
import SearchResults from "@/components/shared/SearchResults";
import mockData from "@/mocks/searchResults.json";

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredResults, setFilteredResults] = useState(mockData);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    let results = mockData;
    if (searchQuery) {
      results = results.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedCategory !== "all") {
      results = results.filter((item) => item.type === selectedCategory);
    }
    setFilteredResults(results);
  }, [searchQuery, selectedCategory]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Search Results</h1>
      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      <SearchFilters selected={selectedCategory} onChange={setSelectedCategory} />
      <SearchResults results={filteredResults} />
    </div>
  );
};

export default SearchPage;
