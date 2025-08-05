import { useEffect, useMemo, useState } from "react";
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

function AdminBooksPage() {
  const { t } = useTranslation("dashboard");

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ search: "", category: "", status: "" });
  const [loading, setLoading] = useState(true);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const perPage = 9;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchBooks();
        setBooks(data);
        const cats = await fetchBookCategories();
        setCategories(cats);
      } catch (err) {
        toast.error(t("Failed to load data"));
        console.error("Error loading:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredBooks = useMemo(() => {
    let result = books;

    if (filters.search) {
      result = result.filter((b) =>
        b.title.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.category) {
      result = result.filter((b) => b.category_id === Number(filters.category));
    }

    if (filters.status) {
      result = result.filter((b) => b.status === filters.status);
    }

    if (sortBy === "title") {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "oldest") {
      result = [...result].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else {
      result = [...result].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return result;
  }, [books, filters, sortBy]);

  const paginatedBooks = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredBooks.slice(start, start + perPage);
  }, [filteredBooks, page]);

  const handleSelectBook = (id) => {
    setSelectedBooks((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!confirm(t("Are you sure you want to delete selected books?"))) return;

    for (let id of selectedBooks) {
      try {
        await deleteBook(id);
        setBooks((prev) => prev.filter((b) => b.id !== id));
      } catch (err) {
        toast.error(t("Failed to delete book ID") + ` ${id}`);
      }
    }

    setSelectedBooks([]);
    toast.success(t("Books deleted successfully"));
  };

  return (
    <AdminLayout>
      <section className="py-10 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">{t("Books")}</h1>
          <Link
            href="/dashboard/admin/books/create"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {t("Add Book")}
          </Link>
        </div>

        {/* Filters */}
        <div className="sticky top-0 z-10 bg-white border rounded-md p-4 mb-6 flex flex-wrap gap-4 items-center shadow-sm">
          <input
            type="text"
            placeholder={t("Search by title")}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="border rounded p-2 w-full sm:w-56"
          />
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="border rounded p-2 w-full sm:w-40"
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
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border rounded p-2 w-full sm:w-40"
          >
            <option value="">{t("All Statuses")}</option>
            <option value="pending">{t("Pending")}</option>
            <option value="approved">{t("Approved")}</option>
            <option value="rejected">{t("Rejected")}</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded p-2 w-full sm:w-40"
          >
            <option value="newest">{t("Newest First")}</option>
            <option value="oldest">{t("Oldest First")}</option>
            <option value="title">{t("Title A-Z")}</option>
          </select>
          {selectedBooks.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="ml-auto px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              {t("Delete Selected")} ({selectedBooks.length})
            </button>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <p className="text-center text-gray-500">{t("Loading books...")}</p>
        ) : filteredBooks.length === 0 ? (
          <p className="text-gray-500 text-center">{t("No books found.")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedBooks.map((book) => (
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
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredBooks.length > perPage && (
          <div className="flex justify-center mt-6 gap-2">
            {Array.from({ length: Math.ceil(filteredBooks.length / perPage) }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-3 py-1 rounded ${
                  page === i + 1 ? "bg-yellow-400 text-white" : "bg-gray-100"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
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
