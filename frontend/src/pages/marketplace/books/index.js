// pages/website/books/index.js
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FaSearch, FaFilter, FaArrowUp } from "react-icons/fa";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import BookCard from "@/components/books/BookCard";
import BookFilterSidebar from "@/components/books/FilterSidebar";
import { fetchBooks, buildUrl } from "@/services/bookService";
import useBookWishlistStore from "@/store/books/wishlistStore";
import useBookCartStore from "@/store/books/cartStore";
import { toast } from "react-toastify";

export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("default");
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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadMoreError, setLoadMoreError] = useState(null);
  const loader = useRef(null);
  const addToWishlist = useBookWishlistStore((state) => state.addToWishlist);
  const addToCart = useBookCartStore((state) => state.addToCart);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setBooks([]);
    setPage(1);
    setHasMore(true);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setBooks([]);
    setPage(1);
    setHasMore(true);
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
    setBooks([]);
    setPage(1);
    setHasMore(true);
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
    setBooks([]);
    setPage(1);
    setHasMore(true);
  };

  const handleAddToWishlist = (book) => {
    const item = {
      book_id: book.id,
      title: book.title,
      price: book.price,
      cover_url:
        book.cover_image_url ||
        buildUrl(book.cover_image) ||
        "/images/default-book-cover.jpg",
    };
    addToWishlist(item);
    toast.success("Added to wishlist");
  };

  const handleAddToCart = (book) => {
    const item = {
      book_id: book.id,
      title: book.title,
      price: book.price,
      cover_url:
        book.cover_image_url ||
        buildUrl(book.cover_image) ||
        "/images/default-book-cover.jpg",
    };
    addToCart(item);
    toast.success("Added to cart");
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { books: data } = await fetchBooks({
          page,
          perPage: 6,
          filters: { ...filters, search: searchQuery },
          sort: sortBy !== "default" ? { sortBy } : {},
        });
        setBooks((prev) => (page === 1 ? data : [...prev, ...data]));
        setHasMore(data.length === 6);
        setLoadMoreError(null);
      } catch (err) {
        console.error(err);
        if (page === 1) {
          setError("❌ Failed to load books. Please try again later.");
        } else {
          const msg = "❌ Failed to load more books. Please try again.";
          toast.error(msg);
          setLoadMoreError(msg);
        }
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, filters, sortBy, searchQuery]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setPage((prev) => prev + 1);
      }
    });
    if (loader.current) observer.observe(loader.current);
    return () => {
      if (loader.current) observer.unobserve(loader.current);
    };
  }, [hasMore, loading]);

  if (loading && books.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-yellow-400">
        ⏳ Loading books...
      </div>
    );
  }

  if (error && books.length === 0) {
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
              onChange={handleSearchChange}
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
                  onChange={handleSearchChange}
                  placeholder="Search by title or author..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                />
              </div>

              <div className="flex items-center gap-4">
                <span className="text-gray-400">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={handleSortChange}
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
            {books.length === 0 && !loading ? (
              <p className="text-gray-400">No books found with selected filters.</p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {books.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onAddToWishlist={() => handleAddToWishlist(book)}
                    onAddToCart={() => handleAddToCart(book)}
                  />
                ))}
              </div>
            )}

            {loadMoreError && (
              <p className="text-center text-red-500 mt-4">{loadMoreError}</p>
            )}

            {loading && books.length > 0 && (
              <p className="text-center text-gray-400 mt-4">Loading...</p>
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
