import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import SearchBar from "@/components/shared/SearchBar";
import SearchFilters from "@/components/shared/SearchFilters";
import SearchResults from "@/components/shared/SearchResults";
import { searchAll } from "@/services/searchService";

const SearchPage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (router.query.q) {
      setSearchQuery(router.query.q);
    }
  }, [router.query.q]);

  useEffect(() => {
    if (searchQuery) {
      router.replace(
        { pathname: "/search", query: { q: searchQuery } },
        undefined,
        { shallow: true }
      );
    }
  }, [searchQuery]);

  useEffect(() => {
    if (!searchQuery) {
      setResults([]);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    searchAll(searchQuery)
      .then((data) => {
        if (!isMounted) return;
        const flat = [];
        Object.entries(data || {}).forEach(([type, arr]) => {
          (arr || []).forEach((item) =>
            flat.push({
              id: item.id,
              title: item.title || item.full_name,
              description: item.description || item.excerpt || "",
              image: item.cover || item.image || item.avatar_url,
              type,
            })
          );
        });
        setResults(flat);
      })
      .catch(() => isMounted && setError("Failed to fetch results"))
      .finally(() => isMounted && setLoading(false));

    return () => {
      isMounted = false;
    };
  }, [searchQuery]);

  const filteredResults =
    selectedCategory === "all"
      ? results
      : results.filter((r) => r.type === selectedCategory);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Search Results</h1>
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onKeyDown={(e) =>
          e.key === "Enter" &&
          router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
        }
      />
      <SearchFilters selected={selectedCategory} onChange={setSelectedCategory} />
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && <SearchResults results={filteredResults} />}
    </div>
  );
};

export default SearchPage;
