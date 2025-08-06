import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FaSearch, FaFilter, FaArrowUp } from "react-icons/fa";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import BookCard from "@/components/books/BookCard";
import BookFilterSidebar from "@/components/books/FilterSidebar";
import { fetchBooks } from "@/services/bookService";

const BooksPage = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("default");
  const [visibleCount, setVisibleCount] = useState(6);
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [filters, setFilters] = useState({
    categories: [],
    levels: [],
    price: 100,
  });
  const loader = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleFilterChange = (f) => {
    setFilters(f);
    setVisibleCount(6);
  };

  const resetFilters = () => {
    setFilters({ categories: [], levels: [], price: 100 });
  };

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const { books: data } = await fetchBooks();
        setBooks(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load books");
      } finally {
        setLoading(false);
      }
    };
    loadBooks();
  }, []);

  const filteredBooks = books.filter((book) => {
    const matchCategory =
      !filters.categories.length ||
      filters.categories.includes(book.category_name);

    const matchLevel =
      !filters.levels.length || filters.levels.includes(book.level);

    const matchPrice =
      !filters.price ||
      !book.is_paid ||
      (book.price != null && Number(book.price) <= Number(filters.price));

    const matchSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (book.author || "").toLowerCase().includes(searchQuery.toLowerCase());

    return matchCategory && matchLevel && matchPrice && matchSearch;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (sortBy === "price") return (a.price || 0) - (b.price || 0);
    if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
    return 0;
  });

  const visibleBooks = sortedBooks.slice(0, visibleCount);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 3, sortedBooks.length));
        }
      },
      { threshold: 1 }
    );

    if (loader.current) observer.observe(loader.current);

    return () => {
      if (loader.current) observer.unobserve(loader.current);
    };
  }, [loader, sortedBooks.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-yellow-400">
        ⏳ Loading books...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <section className="min-h-screen relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-10" />
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500"
            whileHover={{ scale: 1.02 }}
          >
            📚 Books Marketplace
          </motion.h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Discover our curated selection of books.
          </p>
        </motion.div>

        {/* Mobile Filters Button */}
        <div className="lg:hidden mb-6 flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-800/60 backdrop-blur-sm border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <button
            className="ml-3 p-2.5 rounded-lg bg-gray-800/60 backdrop-blur-sm border border-gray-700 hover:bg-gray-700 transition-all"
            onClick={() => document.getElementById('filter-sidebar').classList.toggle('translate-x-full')}
          >
            <FaFilter className="text-yellow-400" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filter Sidebar */}
          <div
            id="filter-sidebar"
            className="fixed lg:sticky top-0 left-0 lg:left-auto h-screen lg:h-auto w-full lg:w-1/4 bg-gray-900/80 backdrop-blur-lg lg:backdrop-blur-none lg:bg-transparent p-6 lg:p-0 z-30 transform lg:transform-none transition-transform duration-300 translate-x-full lg:translate-x-0"
          >
            <div className="flex justify-between items-center mb-6 lg:hidden">
              <h3 className="text-xl font-bold text-yellow-400">Filters</h3>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => document.getElementById('filter-sidebar').classList.add('translate-x-full')}
              >
                ✕
              </button>
            </div>
            <BookFilterSidebar
              onFilterChange={handleFilterChange}
              onResetFilters={resetFilters}
            />
          </div>

          <div className="flex-grow">
            {/* Desktop Search & Sort */}
            <div className="hidden lg:flex items-center justify-between gap-4 mb-8">
              <div className="relative w-full max-w-md">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search books, authors..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-800/60 backdrop-blur-sm border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-gray-400">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="default">Default</option>
                  <option value="price">Price</option>
                  <option value="rating">Rating</option>
                </select>
              </div>
            </div>

            {visibleBooks.length === 0 ? (
              <p className="text-gray-400">No books match the selected filters.</p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {visibleBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            )}

            <div ref={loader} />

            {showScrollToTop && (
              <button
                className="fixed bottom-8 right-8 p-3 rounded-full bg-yellow-500 text-gray-900 hover:bg-yellow-400 transition-all"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <FaArrowUp />
              </button>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </section>
  );
};

export default BooksPage;

