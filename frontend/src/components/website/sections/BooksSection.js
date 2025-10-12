import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import { motion } from "framer-motion";
import BookCard from "@/components/books/BookCard";
import { fetchBooks } from "@/services/bookService";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import useCartStore from "@/store/cart/cartStore";
import useAuthStore from "@/store/auth/authStore";
import { mapBookForCart } from "@/utils/bookMapping";

const BooksSection = () => {
  const { t } = useTranslation("website");
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const { isAuthenticated, user } = useAuthStore();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadBooks = async () => {
      setLoading(true);
      setError(false);
      try {
        const { books: list } = await fetchBooks({
          perPage: 3,
          signal: controller.signal,
        });
        setBooks(list);
      } catch (err) {
        if (err.name !== "CanceledError" && err.name !== "AbortError") {
          console.error(t("failed_load_books"), err);
          setError(true);
        }
      } finally {
        setLoading(false);
      }
    };

    loadBooks();

    return () => controller.abort();
  }, []);

  const handleAddToCart = async (book) => {
    if (!isAuthenticated()) {
      toast.info(t("please_login_to_purchase"));
      router.push("/auth/login");
      return;
    }
    if (user?.role?.toLowerCase() !== "student") {
      toast.error(t("only_students_can_purchase"));
      return;
    }
    const ok = await addItem(mapBookForCart(book));
    if (ok) toast.success(t("added_to_cart"));
    else toast.error(t("failed_to_add_to_cart"));
  };

  return (
    <section id="books" className="bg-gray-950 py-16 text-white text-center">
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
        <p className="text-gray-300 mb-8">{t("loading_books")}</p>
      ) : error ? (
        <p className="text-red-500 mb-8">{t("failed_load_books")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-8 px-4">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onAddToCart={() => handleAddToCart(book)}
              cornerAddToCart
            />
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
