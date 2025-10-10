import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import BookCardSkeleton from "@/components/books/BookCardSkeleton";
import { deleteBook, updateBookStatus } from "@/services/bookService";
import { fetchInstructorBooks } from "@/services/instructor/bookService";
import { fetchBookCategories } from "@/services/bookCategoryService";
import { getLanguages } from "@/services/languageService";
import { fetchBookTags } from "@/services/bookTagService";
import withAuthProtection from "@/hooks/withAuthProtection";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import toast from "react-hot-toast";
import { useTranslation } from "next-i18next";
import {
  FiAlertTriangle,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiX,
  FiEdit,
  FiEye,
} from "react-icons/fi";
// Switch removed as status is no longer a simple toggle
import ConfirmModal from "@/components/common/ConfirmModal";
import { buildUrl } from "@/utils/url";
import useBookTable from "@/hooks/useBookTable";

function InstructorBooksPage() {
  const { t } = useTranslation("dashboard");
  const router = useRouter();

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const {
    filters,
    setFilters,
    selectedItems: selectedBooks,
    setSelectedItems: setSelectedBooks,
    allSelected,
    handleSelect: handleSelectBook,
    toggleSelectAll,
    bulkStatus,
    setBulkStatus,
    page,
    setPage,
    meta,
    setMeta,
    resetFilters,
    hasActiveFilters,
    totalPages,
    startIndex,
    endIndex,
    perPage,
  } = useBookTable({
    items: books,
    perPage: 12,
    storageKey: "instructorBooksFilters",
    initialFilters: {
      search: "",
      category: "",
      status: "",
      priceRange: 0,
      language: "",
      tags: [],
    },
  });

  const [visibleCount, setVisibleCount] = useState(perPage);
  const loader = useRef(null);
  const sortedBooks = useMemo(
    () =>
      [...books].sort((a, b) => {
        switch (sortBy) {
          case "oldest": {
            const aDate = new Date(a.created_at || a.createdAt);
            const bDate = new Date(b.created_at || b.createdAt);
            return aDate - bDate;
          }
          case "title":
            return (a.title || "").localeCompare(b.title || "");
          case "price-high":
            return Number(b.price) - Number(a.price);
          case "price-low":
            return Number(a.price) - Number(b.price);
          default: {
            const aDate = new Date(a.created_at || a.createdAt);
            const bDate = new Date(b.created_at || b.createdAt);
            return bDate - aDate;
          }
        }
      }),
    [books, sortBy]
  );

  useEffect(() => {
    setVisibleCount((prev) => {
      const limit = Math.min(perPage, sortedBooks.length || perPage);
      return prev !== limit ? limit : prev;
    });
  }, [perPage, sortedBooks.length]);

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
    if (router.query.created) {
      toast.success(
        t("booksCreate.success", {
          defaultValue:
            "Thank you! Your book was added successfully and is under review. After it is approved, you will see it published in the bookstore",
        })
      );
      router.replace("/dashboard/instructor/books", undefined, { shallow: true });
    }
  }, [router, t]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await fetchBookCategories();
        const langs = await getLanguages();
        setCategories(cats);
        setLanguages(langs);
      } catch (err) {
        toast.error(t("Failed to load data"));
        setError(t("Failed to load data"));
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

  const booksAbortRef = useRef(null);

  const loadBooks = useCallback(
    async (currentPage = page) => {
      booksAbortRef.current?.abort();
      const controller = new AbortController();
      booksAbortRef.current = controller;
      try {
        setLoading(true);
        setError(null);
        const { books: list, meta } = await fetchInstructorBooks({
          page: currentPage,
          perPage,
          filters,
          sort: { sortBy },
          signal: controller.signal,
        });
        setBooks(list);
        setMeta(meta);
      } catch (err) {
        if (err.name !== "CanceledError" && err.name !== "AbortError") {
          const message = t("Failed to load data");
          toast.error(message);
          console.error("Error loading:", err);
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    },
    [page, perPage, filters, sortBy, t]
  );

  useEffect(() => {
    loadBooks();
    return () => {
      booksAbortRef.current?.abort();
    };
  }, [loadBooks]);

  const handleBulkDelete = () => {
    if (selectedBooks.length === 0) return;
    const idsToDelete = [...selectedBooks];
    const currentPageCount = books.length;
    openConfirmModal({
      title: t("Confirm Deletion"),
      message: t("Are you sure you want to delete selected books?"),
      onConfirm: async () => {
        try {
          await Promise.all(idsToDelete.map((id) => deleteBook(id)));
          const deleteCount = idsToDelete.length;
          const newTotal = Math.max(0, (meta.total ?? 0) - deleteCount);
          const newTotalPages = Math.max(1, Math.ceil(newTotal / perPage));
          setMeta((m) => ({ ...m, total: newTotal, totalPages: newTotalPages }));
          setSelectedBooks([]);
          toast.success(t("Books deleted successfully"));

          const nextPage = currentPageCount === deleteCount && page > 1 ? page - 1 : page;
          if (nextPage !== page) {
            setPage(nextPage);
          } else {
            await loadBooks(nextPage);
          }
        } catch (err) {
          toast.error(t("Failed to delete some books"));
        }
      },
    });
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus) return;
    openConfirmModal({
      title: t("Confirm Status Change"),
      message: t("Change status of selected books?"),
      onConfirm: async () => {
        try {
          const updatePromises = selectedBooks.map(id => updateBookStatus(id, bulkStatus));
          await Promise.all(updatePromises);
          setBooks(prev =>
            prev.map(b =>
              selectedBooks.includes(b.id) ? { ...b, status: bulkStatus } : b
            )
          );
          toast.success(t("Status updated"));
          setSelectedBooks([]);
          setBulkStatus("");
        } catch (err) {
          toast.error(t("Failed to update status"));
        }
      }
    });
  };

  const handleStatusChange = async (bookId, newStatus, currentStatus) => {
    setBooks(prev =>
      prev.map(book =>
        book.id === bookId ? { ...book, status: newStatus } : book
      )
    );
    try {
      await updateBookStatus(bookId, newStatus);
      toast.success(t("Status updated"));
    } catch (err) {
      setBooks(prev =>
        prev.map(book =>
          book.id === bookId ? { ...book, status: currentStatus } : book
        )
      );
      toast.error(t("Failed to update status"));
    }
  };

  const visibleBooks = sortedBooks.slice(0, visibleCount);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((prev) => Math.min(prev + 3, sortedBooks.length));
      }
    }, { threshold: 1 });
    if (loader.current) observer.observe(loader.current);
    return () => loader.current && observer.unobserve(loader.current);
  }, [loader, sortedBooks.length]);

  return (
    <>
      <section className="py-8 px-4 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">{t("books")}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {t("booksList.showingRange", {
                start: books.length ? startIndex : 0,
                end: books.length ? endIndex : 0,
                total: meta.total ?? 0,
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="sm:hidden flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <FiFilter className="text-lg" />
              <span>{t("booksList.filtersLabel")}</span>
            </button>
            <Link
              href="/dashboard/instructor/books/create"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg whitespace-nowrap"
            >
              <FiPlus className="text-lg" />
              <span>{t("Add Book")}</span>
            </Link>
          </div>
        </div>

        {!loading && error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
            <div className="flex items-start gap-2">
              <FiAlertTriangle className="mt-0.5 shrink-0 text-lg" />
              <div>
                <p className="font-medium">{t("Failed to load data", { defaultValue: "Failed to load data" })}</p>
                <p className="mt-1">{error}</p>
                <button
                  type="button"
                  onClick={() => loadBooks(page)}
                  className="mt-3 inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-800/40"
                >
                  {t("Retry", { defaultValue: "Retry" })}
                </button>
              </div>
            </div>
          </div>
        )}

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
              <h3 className="font-medium text-gray-700 dark:text-gray-300">{t("booksList.filtersLabel")}</h3>
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
            <div className="flex items-center gap-2">
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-1.5 text-sm"
              >
                <option value="">{t("Change Status")}</option>
                <option value="pending">{t("Pending")}</option>
                <option value="approved">{t("Approved")}</option>
                <option value="rejected">{t("Rejected")}</option>
              </select>
              <button
                onClick={handleBulkStatusUpdate}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                {t("Apply")}
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                <FiTrash2 className="text-sm" />
                <span>{t("Delete Selected")}</span>
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: perPage }).map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <FiSearch className="text-3xl text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">{t("booksList.noBooksFound")}</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {filters.search || filters.category || filters.status
                ? t("booksList.tryAdjustingFilters")
                : t("booksList.emptyState")}
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                {t("booksList.clearAllFilters")}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleBooks.map((book) => {
                const coverUrl =
                  book.cover_image_url ||
                  buildUrl(book.cover_image) ||
                  "/images/default-book-cover.jpg";
                return (
                  <div
                    key={book.id}
                    className={`relative rounded-xl overflow-hidden border dark:border-gray-700 transition-all duration-200 hover:shadow-lg ${
                      selectedBooks.includes(book.id)
                        ? "ring-2 ring-blue-500 border-blue-500"
                        : "hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBooks.includes(book.id)}
                      onChange={() => handleSelectBook(book.id)}
                      className="absolute top-3 left-3 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 z-10"
                    />

                    <div className="relative">
                      <img
                        src={coverUrl}
                        alt={book.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-3 right-3">
                        <select
                          value={book.status}
                          onChange={(e) =>
                            handleStatusChange(book.id, e.target.value, book.status)
                          }
                          className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-xs rounded px-2 py-1"
                        >
                          <option value="pending">{t("Pending")}</option>
                          <option value="approved">{t("Approved")}</option>
                          <option value="rejected">{t("Rejected")}</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-lg line-clamp-1">{book.title}</h3>
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs px-2 py-1 rounded">
                          {Number(book.price) > 0 ? `$${book.price}` : t("free_label")}
                        </span>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-2 line-clamp-1">
                        {book.author}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {book.tags?.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            book.status === "approved"
                              ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                              : book.status === "pending"
                              ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                              : book.status === "rejected"
                              ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {t(book.status)}
                        </span>

                        <div className="flex gap-2">
                          <Link
                            href={`/dashboard/instructor/books/${book.id}`}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                            title={t("Edit")}
                          >
                            <FiEdit className="text-lg" />
                          </Link>
                          <Link
                            href={`/books/${book.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                            title={t("View")}
                          >
                            <FiEye className="text-lg" />
                          </Link>
                          <button
                            onClick={() =>
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
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                            title={t("Delete")}
                          >
                            <FiTrash2 className="text-lg" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div ref={loader} />

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
    </>
  );
};

const ProtectedInstructorBooksPage = withAuthProtection(InstructorBooksPage, ["instructor"]);

ProtectedInstructorBooksPage.getLayout = (page) => (
  <InstructorLayout>{page}</InstructorLayout>
);

export default ProtectedInstructorBooksPage;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
