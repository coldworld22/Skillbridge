import { useEffect, useState } from "react";
import Link from "next/link";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import BookCard from "@/components/books/BookCard";
import { fetchInstructorBooks } from "@/services/instructor/bookService";

export default function InstructorBooksPage() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchInstructorBooks();
        setBooks(data);
      } catch (err) {
        console.error("Failed to load books", err);
      }
    };
    load();
  }, []);

  return (
    <InstructorLayout>
      <section className="py-10 px-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">My Books</h1>
          <Link
            href="/dashboard/instructor/books/create"
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Add Book
          </Link>
        </div>
        {books.length === 0 ? (
          <p className="text-gray-500">No books found.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </section>
    </InstructorLayout>
  );
}
