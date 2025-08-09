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
import useCartStore from "@/store/cart/cartStore";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../next-i18next.config.js";

const buildBookItem = (book) => ({
  id: book.id,
  name: book.title,
  price: book.price,
  cover_url:
    book.cover_image_url ||
    buildUrl(book.cover_image) ||
    "/images/default-book-cover.jpg",
});

const buildWishlistItem = (book) => ({
  book_id: book.id,
  title: book.title,
  price: book.price,
  cover_url:
    book.cover_image_url ||
    buildUrl(book.cover_image) ||
    "/images/default-book-cover.jpg",
});

export default function BooksPage() {
  const { t } = useTranslation(["website", "common"]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("default");
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  // Filters sent to the API. Backend expects single `category` and `priceRange`
  // rather than the plural keys that were previously used. Using the wrong
  // parameter names meant filtering never actually happened on the server.
  // We keep the shape here aligned with what `book.service.js` expects.
  const [filters, setFilters] = useState({
    category: "",
    priceRange: 100,
    language: "",
    tags: [],
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const loader = useRef(null);
  const addToWishlist = useBookWishlistStore((state) => state.addToWishlist);
  const addItem = useCartStore((state) => state.addItem);

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
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setBooks([]);
    setPage(1);
    setHasMore(true);
  };

  const resetFilters = () => {
    setFilters({
      category: "",
      priceRange: 100,
      language: "",
      tags: [],
    });
    setBooks([]);
    setPage(1);
    setHasMore(true);
  };

  const handleAddToWishlist = (book) => {
    addToWishlist(buildWishlistItem(book));
    toast.success("Added to wishlist");
  };

  const handleAddToCart = async (book) => {
    await addItem(buildBookItem(book));
    toast.success("Added to cart");
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const apiFilters = {
          ...(filters.category && { category: filters.category }),
          ...(filters.priceRange !== undefined && {
            priceRange: filters.priceRange,
          }),
          ...(filters.language && { language: filters.language }),
          ...(filters.license && { license: filters.license }),
          ...(filters.tags.length && { tags: filters.tags }),
          search: searchQuery,
          status: "active",
        };

        const { books: data } = await fetchBooks({
          page,
          perPage: 6,
          filters: apiFilters,
          sort: sortBy !== "default" ? { sortBy } : {},
        });
        setBooks((prev) => (page === 1 ? data : [...prev, ...data]));
        setHasMore(data.length === 6);
      } catch (err) {
        console.error(err);
        if (page === 1) {
          setError(t("failed_load_books"));
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
          {t("loading_books")}
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
      <ToastContainer position="top-right" autoClose={3000} />

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
            {t("books_marketplace_title")}
          </motion.h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            {t("books_marketplace_description")}
          </p>
        </motion.div>

        {/* Mobile Filter & Search */}
        <div className="lg:hidden mb-6 flex justify-between items-center gap-4">
          <div className="relative w-full">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={t("search_books_placeholder")}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
            />
          </div>
          <button
            className="p-2 rounded-lg bg-gray-800 border border-gray-700"
            onClick={() => setIsFilterOpen((prev) => !prev)}
          >
            <FaFilter className="text-yellow-400" />
          </button>
        </div>

          <div className="flex flex-col lg:flex-row gap-6 relative">
          {isFilterOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-20 lg:hidden"
              onClick={() => setIsFilterOpen(false)}
            />
          )}
          {/* Filter Sidebar */}
          <div
            className={`fixed lg:sticky top-0 left-0 lg:left-auto h-screen lg:h-auto w-full lg:w-1/4 bg-gray-900/90 backdrop-blur-lg p-6 lg:p-0 z-30 transform lg:transform-none transition-transform duration-300 ${isFilterOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
          >
            <div className="flex justify-between items-center mb-4 lg:hidden">
              <h3 className="text-xl font-bold text-yellow-400">{t("filters")}</h3>
              <button
                onClick={() => setIsFilterOpen(false)}
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
                  placeholder={t("search_title_author_placeholder")}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                />
              </div>

              <div className="flex items-center gap-4">
                <span className="text-gray-400">{t("sort_by")}</span>
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2"
                >
                  <option value="default">{t("sort_default")}</option>
                  <option value="price">{t("sort_price")}</option>
                  <option value="rating">{t("sort_rating")}</option>
                  <option value="newest">{t("sort_newest")}</option>
                </select>
              </div>
            </div>

            {/* Book Grid */}
            {books.length === 0 && !loading ? (
              <p className="text-gray-400">{t("no_books_found")}</p>
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

            {loading && books.length > 0 && (
              <p className="text-center text-gray-400 mt-4">{t("loading")}</p>
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

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "website"], nextI18NextConfig)),
    },
  };
}
