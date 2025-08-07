// pages/website/books/index.js
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  FaSearch,
  FaFilter,
  FaArrowUp,
  FaPlus,
  FaRegTimesCircle,
} from "react-icons/fa";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import BookCard from "@/components/books/BookCard";
import BookFilterSidebar from "@/components/books/FilterSidebar";
import { fetchBooks } from "@/services/bookService";

export default function BooksPage() {
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
    language: "",
    license: "",
    tags: [],
  });
  const loader = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
    setVisibleCount(6);
  };

  const resetFilters = () => {
    setFilters({
      categories: [],
      levels: [],
      price: 100,
      language: "",
      license: "",
      tags: [],
    });
  };

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const { books: data } = await fetchBooks();
        setBooks(data);
      } catch (err) {
        console.error(err);
        setError("❌ Failed to load books. Please try again later.");
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
    const matchLanguage =
      !filters.language || filters.language === book.language;
    const matchLicense =
      !filters.license || filters.license === book.license_type;
    const matchTags =
      !filters.tags.length ||
      filters.tags.every((tag) => book.tags?.includes(tag));
    const matchSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (book.author || "").toLowerCase().includes(searchQuery.toLowerCase());

    return (
      matchCategory &&
      matchLevel &&
      matchPrice &&
      matchLanguage &&
      matchLicense &&
      matchTags &&
      matchSearch
    );
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (sortBy === "price") return (a.price || 0) - (b.price || 0);
    if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
    if (sortBy === "newest") return new Date(b.created_at) - new Date(a.created_at);
    return 0;
  });

  const visibleBooks = sortedBooks.slice(0, visibleCount);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting) {
        setVisibleCount((prev) => Math.min(prev + 6, sortedBooks.length));
      }
    });
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
            Discover free and paid books created by verified instructors.
          </p>
        </motion.div>

        {/* Mobile Filter & Search */}
        <div className="lg:hidden mb-6 flex justify-between items-center gap-4">
          <div className="relative w-full">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
            />
          </div>
          <button
            className="p-2 rounded-lg bg-gray-800 border border-gray-700"
            onClick={() =>
              document
                .getElementById("filter-sidebar")
                .classList.toggle("translate-x-full")
            }
          >
            <FaFilter className="text-yellow-400" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter Sidebar */}
          <div
            id="filter-sidebar"
            className="fixed lg:sticky top-0 left-0 lg:left-auto h-screen lg:h-auto w-full lg:w-1/4 bg-gray-900/90 backdrop-blur-lg p-6 lg:p-0 z-30 transform lg:transform-none transition-transform duration-300 translate-x-full lg:translate-x-0"
          >
            <div className="flex justify-between items-center mb-4 lg:hidden">
              <h3 className="text-xl font-bold text-yellow-400">Filters</h3>
              <button
                onClick={() =>
                  document
                    .getElementById("filter-sidebar")
                    .classList.add("translate-x-full")
                }
                className="text-white text-lg"
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
            <div className="hidden lg:flex justify-between items-center gap-4 mb-6">
              <div className="relative w-full max-w-md">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title or author..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                />
              </div>

              <div className="flex items-center gap-4">
                <span className="text-gray-400">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2"
                >
                  <option value="default">Default</option>
                  <option value="price">Price</option>
                  <option value="rating">Rating</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>

            {/* Book Grid */}
            {visibleBooks.length === 0 ? (
              <p className="text-gray-400">No books found with selected filters.</p>
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
                onClick={() =>
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }
                className="fixed bottom-8 right-8 z-40 p-3 rounded-full bg-yellow-500 text-gray-900 hover:bg-yellow-400 transition-all"
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
}
