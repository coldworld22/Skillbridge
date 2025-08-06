import { useEffect, useState } from "react";
import StudentLayout from "@/components/layouts/StudentLayout";
import BookCard from "@/components/books/BookCard";
import { fetchBooks } from "@/services/bookService";

export default function StudentBooksPage() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { books: data } = await fetchBooks();
        setBooks(data);
      } catch (e) {
        console.error("Failed to load books", e);
      }
    };
    load();
  }, []);

  return (
    <StudentLayout>
      <section className="py-10 px-4 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Books</h1>
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
    </StudentLayout>
  );
}
