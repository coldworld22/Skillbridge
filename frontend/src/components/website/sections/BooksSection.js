import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import { motion } from "framer-motion";
import BookCard from "@/components/books/BookCard";
import { fetchBooks } from "@/services/bookService";

const BooksSection = () => {
  const { t } = useTranslation("website");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const { books: list } = await fetchBooks({ perPage: 3 });
        setBooks(list);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to load books", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, []);

  return (
    <section className="bg-gray-950 py-16 text-white text-center">
      <motion.h2
        className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-4"
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        📖 {t("explore_books")}
      </motion.h2>
      <p className="text-gray-300 mb-8">{t("discover_books")}</p>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-8 px-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="text-gray-400 mb-8">{t("failed_load_books")}</p>
      ) : books.length === 0 ? (
        <p className="text-gray-400 mb-8">{t("no_books")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-8 px-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}

      <motion.a
        href="/marketplace/books"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="inline-block bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-full font-semibold transition"
      >
        {t("explore_books")}
      </motion.a>
    </section>
  );
};

export default BooksSection;

