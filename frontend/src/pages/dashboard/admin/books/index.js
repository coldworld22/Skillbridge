import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/layouts/AdminLayout";
import BookCard from "@/components/books/BookCard";
import { fetchBooks, deleteBook } from "@/services/bookService";
import { fetchBookCategories } from "@/services/bookCategoryService";
import withAuthProtection from "@/hooks/withAuthProtection";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import toast from "react-hot-toast";
import { useTranslation } from "next-i18next";
import { FiPlus, FiSearch, FiTrash2, FiChevronLeft, FiChevronRight } from "react-icons/fi";

function AdminBooksPage() {
  const { t } = useTranslation("dashboard");

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ search: "", category: "", status: "" });
  const [loading, setLoading] = useState(true);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalPages: 1, total: 0 });
  const perPage = 9;

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await fetchBookCategories();
        setCategories(cats);
      } catch (err) {
        toast.error(t("Failed to load data"));
      }
    };
    loadCategories();
  }, [t]);

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

  const totalPages = meta?.totalPages ?? 1;

  const handleSelectBook = (id) => {
    setSelectedBooks((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!confirm(t("Are you sure you want to delete selected books?"))) return;

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
  };

  return (
    <AdminLayout>
      <section className="py-8 px-4 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{t("Books")}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {t("Showing")} {books.length} {t("of")} {meta.total ?? books.length} {t("books")}
            </p>
          </div>
          <Link
            href="/dashboard/admin/books/create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            <FiPlus className="text-lg" />
            <span>{t("Add Book")}</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="sticky top-0 z-10 bg-white border border-gray-200 rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-center shadow-sm">
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t("Search by title")}
              value={filters.search}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value });
                setPage(1);
              }}
              className="border border-gray-300 rounded-lg p-2 pl-10 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          
          <select
            value={filters.category}
            onChange={(e) => {
              setFilters({ ...filters, category: e.target.value });
              setPage(1);
            }}
            className="border border-gray-300 rounded-lg p-2 w-full sm:w-40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          >
            <option value="">{t("All Categories")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPage(1);
            }}
            className="border border-gray-300 rounded-lg p-2 w-full sm:w-40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          >
            <option value="">{t("All Statuses")}</option>
            <option value="pending">{t("Pending")}</option>
            <option value="approved">{t("Approved")}</option>
            <option value="rejected">{t("Rejected")}</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 rounded-lg p-2 w-full sm:w-40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          >
            <option value="newest">{t("Newest First")}</option>
            <option value="oldest">{t("Oldest First")}</option>
            <option value="title">{t("Title A-Z")}</option>
          </select>
          
          {selectedBooks.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md hover:shadow-lg"
            >
              <FiTrash2 className="text-lg" />
              <span>{t("Delete")} ({selectedBooks.length})</span>
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FiSearch className="text-3xl text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">{t("No books found")}</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {filters.search || filters.category || filters.status 
                ? t("Try adjusting your search or filter criteria")
                : t("There are currently no books in the system")}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  isSelected={selectedBooks.includes(book.id)}
                  onSelect={() => handleSelectBook(book.id)}
                  onDelete={async () => {
                    if (!confirm(t("Are you sure?"))) return;
                    try {
                      await deleteBook(book.id);
                      setBooks((prev) => prev.filter((b) => b.id !== book.id));
                      toast.success(t("Book deleted"));
                    } catch {
                      toast.error(t("Failed to delete"));
                    }
                  }}
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
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          page === pageNum 
                            ? "bg-blue-600 text-white" 
                            : "border border-gray-300 hover:bg-gray-50"
                        } transition`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <FiChevronRight className="text-lg" />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </section>
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