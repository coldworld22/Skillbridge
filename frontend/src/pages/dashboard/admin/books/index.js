import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/layouts/AdminLayout";
import BookCard from "@/components/books/BookCard";
import { fetchBooks } from "@/services/bookService";
import { fetchBookCategories } from "@/services/bookCategoryService";
import withAuthProtection from "@/hooks/withAuthProtection";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

function AdminBooksPage() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ search: "", category: "", status: "" });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBooks();
        setBooks(data);
      } catch (err) {
        console.error("Failed to load books", err);
      }
      try {
        const cats = await fetchBookCategories();
        setCategories(cats);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    load();
  }, []);

  const filteredBooks = books.filter((b) => {
    const matchesSearch = filters.search
      ? b.title.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesCategory = filters.category
      ? b.category_id === Number(filters.category)
      : true;
    const matchesStatus = filters.status ? b.status === filters.status : true;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <AdminLayout>
      <section className="py-10 px-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Books</h1>
          <Link
            href="/dashboard/admin/books/create"
            className="px-4 py-2 bg-blue-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            Add Book
          </Link>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by title"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="border rounded p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="border rounded p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border rounded p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        {filteredBooks.length === 0 ? (
          <p className="text-gray-500">No books found.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
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

