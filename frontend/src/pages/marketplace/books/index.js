import { useEffect, useState } from "react";
import { fetchBooks } from "@/services/bookService";
import BookCard from "@/components/books/BookCard";

export default function BooksPage() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBooks();
        setBooks(data);
      } catch (e) {
        console.error("Failed to load books", e);
      }
    };
    load();
  }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {books.map((b) => (
        <BookCard key={b.id} book={b} />
      ))}
    </div>
  );
}
