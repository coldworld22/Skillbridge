import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/layouts/AdminLayout";
import BookCard from "@/components/books/BookCard";
import { fetchBooks, deleteBook } from "@/services/bookService";
import { fetchBookCategories } from "@/services/bookCategoryService";
import { getLanguages } from "@/services/languageService";
import { fetchBookTags } from "@/services/bookTagService";
import withAuthProtection from "@/hooks/withAuthProtection";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import toast from "react-hot-toast";
import { useTranslation } from "next-i18next";
import { FiPlus, FiSearch, FiTrash2, FiChevronLeft, FiChevronRight, FiFilter, FiX } from "react-icons/fi";
import ConfirmModal from "@/components/common/ConfirmModal";

function AdminBooksPage() {
  const { t } = useTranslation("dashboard");

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [filters, setFilters] = useState({ 
    search: "", 
    category: "", 
    status: "", 
    priceRange: 0, 
    language: "", 
    tags: [] 
  });
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [allSelected, setAllSelected] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalPages: 1, total: 0 });
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const perPage = 12;

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const openConfirmModal = ({ title, message, onConfirm }) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await fetchBookCategories();
        const langs = await getLanguages();
        setCategories(cats);
        setLanguages(langs);
      } catch (err) {
        toast.error(t("Failed to load data"));
      }
    };
    loadCategories();
  }, [t]);

  useEffect(() => {
    if (!tagInput) {
      setTagSuggestions([]);
      return;
    }

    fetchBookTags(tagInput)
      .then(setTagSuggestions)
      .catch(() => {});
  }, [tagInput]);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoading(true);
        const { books: list, meta } = await fetchBooks({
          page,
          perPage,
          filters,
          sort: { sortBy },
        });
        setBooks(list);
        setMeta(meta);
      } catch (err) {
        toast.error(t("Failed to load data"));
        console.error("Error loading:", err);
      } finally {
        setLoading(false);
      }
    };
    loadBooks();
  }, [page, filters, sortBy, perPage, t]);

  const filteredBooks = books;
  const totalPages = meta?.totalPages ?? 1;

  const handleSelectBook = (id) => {
    setSelectedBooks((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      setAllSelected(updated.length === filteredBooks.length);
      return updated;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedBooks([]);
      setAllSelected(false);
    } else {
      setSelectedBooks(filteredBooks.map((b) => b.id));
      setAllSelected(true);
    }
  };

  useEffect(() => {
    setAllSelected(
      filteredBooks.length > 0 &&
        selectedBooks.length === filteredBooks.length
    );
  }, [filteredBooks, selectedBooks]);

  const handleBulkDelete = async () => {
    openConfirmModal({
      title: t("Confirm Deletion"),
      message: t("Are you sure you want to delete selected books?"),
      onConfirm: async () => {
        try {
          const deletePromises = selectedBooks.map(id => deleteBook(id));
          await Promise.all(deletePromises);
          setBooks((prev) => prev.filter((b) => !selectedBooks.includes(b.id)));
          setMeta((m) => ({ ...m, total: (m.total ?? 0) - selectedBooks.length }));
          setSelectedBooks([]);
          toast.success(t("Books deleted successfully"));
        } catch (err) {
          toast.error(t("Failed to delete some books"));
        }
      }
    });
  };

  const resetFilters = () => {
    setFilters({ 
      search: "", 
      category: "", 
      status: "", 
      priceRange: 0, 
      language: "", 
      tags: [] 
    });
    setPage(1);
  };

  const hasActiveFilters = (
    filters.search || 
    filters.category || 
    filters.status || 
    filters.priceRange > 0 || 
    filters.language || 
    filters.tags.length > 0
  );

  return (
    <AdminLayout>
      <section className="py-8 px-4 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">{t("Books")}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {t("Showing")} {books.length} {t("of")} {meta.total ?? books.length} {t("books")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="sm:hidden flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <FiFilter className="text-lg" />
              <span>{t("Filters")}</span>
            </button>
            <Link
              href="/dashboard/admin/books/create"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg whitespace-nowrap"
            >
              <FiPlus className="text-lg" />
              <span>{t("Add Book")}</span>
            </Link>
          </div>
        </div>

        {/* Filters - Desktop */}
        <div className={`hidden sm:block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6 shadow-sm`}>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="relative flex-1 min-w-[200px]">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("Search")}</label>
                {hasActiveFilters && (
                  <button 
                    onClick={resetFilters}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <FiX size={14} />
                    {t("Clear filters")}
                  </button>
                )}
              </div>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder={t("Search by title, author...")}
                  value={filters.search}
                  onChange={(e) => {
                    setFilters({ ...filters, search: e.target.value });
                    setPage(1);
                  }}
                  className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2 pl-10 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>
            
            <div className="min-w-[160px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("Category")}</label>
              <select
                value={filters.category}
                onChange={(e) => {
                  setFilters({ ...filters, category: e.target.value });
                  setPage(1);
                }}
                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              >
                <option value="">{t("All Categories")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[160px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("Status")}</label>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters({ ...filters, status: e.target.value });
                  setPage(1);
                }}
                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              >
                <option value="">{t("All Statuses")}</option>
                <option value="pending">{t("Pending")}</option>
                <option value="approved">{t("Approved")}</option>
                <option value="rejected">{t("Rejected")}</option>
              </select>
            </div>

            <div className="min-w-[180px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("Max Price")}: ${filters.priceRange}
              </label>
              <input
                type="range"
                min="0"
                max="500"
                step="10"
                value={filters.priceRange}
                onChange={(e) => {
                  setFilters({ ...filters, priceRange: Number(e.target.value) });
                  setPage(1);
                }}
                className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-4 items-end">
            <div className="min-w-[160px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("Language")}</label>
              <select
                value={filters.language}
                onChange={(e) => {
                  setFilters({ ...filters, language: e.target.value });
                  setPage(1);
                }}
                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              >
                <option value="">{t("All Languages")}</option>
                {languages.map((l) => (
                  <option key={l.id || l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[240px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("Tags")}</label>
              <div className="flex flex-wrap gap-1 mb-1">
                {filters.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() =>
                        setFilters({
                          ...filters,
                          tags: filters.tags.filter((t) => t !== tag),
                        })
                      }
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (tagInput && !filters.tags.includes(tagInput)) {
                        setFilters({ ...filters, tags: [...filters.tags, tagInput] });
                      }
                      setTagInput("");
                    }
                  }}
                  placeholder={t("Add tag and press Enter")}
                  className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
                {tagSuggestions.length > 0 && tagInput && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-auto">
                    {tagSuggestions.map((tg) => (
                      <div
                        key={tg.id}
                        onClick={() => {
                          if (!filters.tags.includes(tg.name)) {
                            setFilters({ ...filters, tags: [...filters.tags, tg.name] });
                          }
                          setTagInput("");
                        }}
                        className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                      >
                        {tg.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="min-w-[160px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("Sort By")}</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              >
                <option value="newest">{t("Newest First")}</option>
                <option value="oldest">{t("Oldest First")}</option>
                <option value="title">{t("Title A-Z")}</option>
                <option value="price-high">{t("Price (High-Low)")}</option>
                <option value="price-low">{t("Price (Low-High)")}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filters - Mobile */}
        {showMobileFilters && (
          <div className="sm:hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-gray-700 dark:text-gray-300">{t("Filters")}</h3>
              <button 
                onClick={() => setShowMobileFilters(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("Search")}</label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder={t("Search by title, author...")}
                    value={filters.search}
                    onChange={(e) => {
                      setFilters({ ...filters, search: e.target.value });
                      setPage(1);
                    }}
                    className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2 pl-10 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("Category")}</label>
                  <select
                    value={filters.category}
                    onChange={(e) => {
                      setFilters({ ...filters, category: e.target.value });
                      setPage(1);
                    }}
                    className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  >
                    <option value="">{t("All Categories")}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("Status")}</label>
                  <select
                    value={filters.status}
                    onChange={(e) => {
                      setFilters({ ...filters, status: e.target.value });
                      setPage(1);
                    }}
                    className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  >
                    <option value="">{t("All Statuses")}</option>
                    <option value="pending">{t("Pending")}</option>
                    <option value="approved">{t("Approved")}</option>
                    <option value="rejected">{t("Rejected")}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("Max Price")}: ${filters.priceRange}
                </label>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="10"
                  value={filters.priceRange}
                  onChange={(e) => {
                    setFilters({ ...filters, priceRange: Number(e.target.value) });
                    setPage(1);
                  }}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("Language")}</label>
                <select
                  value={filters.language}
                  onChange={(e) => {
                    setFilters({ ...filters, language: e.target.value });
                    setPage(1);
                  }}
                  className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                >
                  <option value="">{t("All Languages")}</option>
                  {languages.map((l) => (
                    <option key={l.id || l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("Sort By")}</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                >
                  <option value="newest">{t("Newest First")}</option>
                  <option value="oldest">{t("Oldest First")}</option>
                  <option value="title">{t("Title A-Z")}</option>
                  <option value="price-high">{t("Price (High-Low)")}</option>
                  <option value="price-low">{t("Price (Low-High)")}</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button 
                  onClick={resetFilters}
                  className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1"
                >
                  <FiX size={16} />
                  {t("Clear all filters")}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedBooks.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedBooks.length} {t("selected")}
              </span>
            </div>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors shadow-sm"
            >
              <FiTrash2 className="text-sm" />
              <span>{t("Delete Selected")}</span>
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <FiSearch className="text-3xl text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">{t("No books found")}</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {filters.search || filters.category || filters.status 
                ? t("Try adjusting your search or filter criteria")
                : t("There are currently no books in the system")}
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                {t("Clear all filters")}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  isSelected={selectedBooks.includes(book.id)}
                  onSelect={() => handleSelectBook(book.id)}
                  onDelete={() =>
                    openConfirmModal({
                      title: t("Confirm Deletion"),
                      message: t("Are you sure you want to delete this book?"),
                      onConfirm: async () => {
                        try {
                          await deleteBook(book.id);
                          setBooks((prev) => prev.filter((b) => b.id !== book.id));
                          toast.success(t("Book deleted"));
                        } catch {
                          toast.error(t("Failed to delete"));
                        }
                      },
                    })
                  }
                  onEditLink={`/dashboard/admin/books/edit/${book.id}`}
                  showReadLink
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <FiChevronLeft className="text-lg" />
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show first, last and nearby pages
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm ${
                          page === pageNum 
                            ? "bg-blue-600 text-white" 
                            : "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                        } transition`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {totalPages > 5 && page < totalPages - 2 && (
                    <span className="px-2 text-gray-500">...</span>
                  )}
                  
                  {totalPages > 5 && page < totalPages - 2 && (
                    <button
                      onClick={() => setPage(totalPages)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm ${
                        page === totalPages 
                          ? "bg-blue-600 text-white" 
                          : "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      } transition`}
                    >
                      {totalPages}
                    </button>
                  )}
                  
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <FiChevronRight className="text-lg" />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </section>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
      />
    </AdminLayout>
  );
}

export default withAuthProtection(AdminBooksPage, ["admin", "superadmin"]);

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}