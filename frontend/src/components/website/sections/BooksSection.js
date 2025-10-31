import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { motion } from "framer-motion";
import { FaStar, FaBookOpen } from "react-icons/fa";
import { toast } from "react-hot-toast";
import useCartStore from "@/store/cart/cartStore";
import useAuthStore from "@/store/auth/authStore";
import { fetchBooks } from "@/services/bookService";
import { mapBookForCart } from "@/utils/bookMapping";
import { formatCurrency } from "@/utils/currency";

const BooksSection = () => {
  const { t } = useTranslation("website");
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const { isAuthenticated, user } = useAuthStore();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");

  useEffect(() => {
    const controller = new AbortController();

    const loadBooks = async () => {
      setLoading(true);
      setError(false);
      try {
        const { books: list } = await fetchBooks({
          perPage: 9,
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

  const availableCategories = useMemo(() => {
    const set = new Set();
    books.forEach((book) => {
      const cat = typeof book.category_name === "string" ? book.category_name.trim() : "";
      if (cat) set.add(cat);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [books]);

  const availableLanguages = useMemo(() => {
    const set = new Set();
    books.forEach((book) => {
      const lang = typeof book.language === "string" ? book.language.trim() : "";
      if (lang) set.add(lang);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [books]);

  const filteredBooks = useMemo(() => {
    if (!Array.isArray(books)) return [];
    return books.filter((book) => {
      const title = String(book.title || book.name || "").toLowerCase();
      const description = String(book.short_description || book.description || "").toLowerCase();
      const term = searchTerm.trim().toLowerCase();
      if (term && !title.includes(term) && !description.includes(term)) {
        return false;
      }

      if (categoryFilter !== "all") {
        const category = (book.category_name || "").toLowerCase();
        if (category !== categoryFilter.toLowerCase()) return false;
      }

      if (languageFilter !== "all") {
        const language = (book.language || "").toLowerCase();
        if (language !== languageFilter.toLowerCase()) return false;
      }

      if (priceFilter !== "all") {
        const priceValue = Number(book.price) || 0;
        if (priceFilter === "free" && priceValue > 0) return false;
        if (priceFilter === "paid" && priceValue <= 0) return false;
      }

      return true;
    });
  }, [books, searchTerm, categoryFilter, languageFilter, priceFilter]);

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
      categoryFilter !== "all" ||
      languageFilter !== "all" ||
      priceFilter !== "all"
  );

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setLanguageFilter("all");
    setPriceFilter("all");
  };

  const formatDateChip = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.valueOf())) return null;
    try {
      return date.toLocaleDateString(router.locale || "en", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return date.toISOString().split("T")[0];
    }
  };

  const renderStars = (rating) => {
    const safeRating = Number.isFinite(rating)
      ? Math.min(Math.max(rating, 0), 5)
      : 0;
    return Array.from({ length: 5 }, (_, index) => {
      const starNumber = index + 1;
      const isActive =
        safeRating >= starNumber ||
        (index === 0 && safeRating > 0 && safeRating < 1);
      return (
        <FaStar
          key={index}
          className={`text-sm ${
            isActive ? "text-yellow-400" : "text-gray-600"
          }`}
          aria-hidden="true"
        />
      );
    });
  };

  const renderBooksGrid = () => {
    if (loading) {
      return (
        <p className="text-gray-300 mb-8 text-center">
          {t("loading_books")}
        </p>
      );
    }
    if (error) {
      return (
        <p className="text-red-500 mb-8 text-center">
          {t("failed_load_books")}
        </p>
      );
    }
    if (!books.length) {
      return (
        <p className="text-gray-400 mb-8 text-center">
          {t("no_books_found", "No books available right now.")}
        </p>
      );
    }

    if (!filteredBooks.length) {
      return (
        <p className="text-gray-400 mb-8 text-center">
          {hasActiveFilters
            ? t("no_books_match_filters", "No books match your filters yet.")
            : t("no_books_found", "No books available right now.")}
        </p>
      );
    }

    return (
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 justify-items-center">
        {filteredBooks.map((book, index) => {
          const ratingValue = Number.isFinite(Number(book.rating))
            ? Number(book.rating)
            : 0;
          const ratingCountRaw =
            book.rating_count ?? book.ratingCount ?? book.reviews_count;
          const ratingCount = Number.isFinite(Number(ratingCountRaw))
            ? Number(ratingCountRaw)
            : 0;
          const priceValue = Number(book.price) || 0;
          const formattedPrice = priceValue
            ? formatCurrency(priceValue, {
                currency: book.currency || book.currency_code,
              })
            : t("free");
          const coverSrc =
            book.coverUrl ||
            book.cover_image_url ||
            book.cover_image ||
            "/images/default-book-cover.jpg";
          const rawAuthor = book.author || book.uploaded_by?.name;
          const authorName =
            typeof rawAuthor === "string" &&
            rawAuthor.trim() &&
            rawAuthor.trim().toLowerCase() !== "unknown"
              ? rawAuthor.trim()
              : null;
          const shortDescription =
            book.short_description ||
            book.description ||
            book.detailed_description;
          const rawPageCount =
            book.pages ?? book.page_count ?? book.total_pages;
          const numericPageCount = Number(rawPageCount);
          const pageCount =
            Number.isFinite(numericPageCount) && numericPageCount > 0
              ? Math.round(numericPageCount)
              : null;
          const publishedDate = formatDateChip(
            book.published_at ||
              book.publishedAt ||
              book.created_at ||
              book.createdAt
          );
          const purchasedDate = formatDateChip(
            book.purchasedAt || book.purchased_at
          );

          return (
            <motion.div
              key={book.id || index}
              whileHover={{ scale: 1.03 }}
              className="flex h-full w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 text-white shadow-lg transition-all hover:border-yellow-400"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              onClick={() =>
                router.push(`/marketplace/books/${book.slug || book.id}`)
              }
            >
              <div className="relative h-48">
                <Image
                  src={coverSrc}
                  alt={book.title || book.name}
                  fill
                  className="object-cover group-hover:brightness-75 transition"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={index === 0}
                />
                {book.category_name && (
                  <span className="absolute top-2 left-2 px-2 py-1 text-xs rounded-full shadow text-white font-semibold bg-gray-900/80">
                    {book.category_name}
                  </span>
                )}
                {book.language && (
                  <span className="absolute top-2 right-2 px-2 py-1 text-xs rounded-full shadow text-white font-semibold bg-yellow-500/90 text-gray-900">
                    {book.language}
                  </span>
                )}
              </div>

              <div className="flex h-full flex-col gap-5 p-5">
                <div className="flex flex-col items-center gap-3 text-center">
                  <h3 className="line-clamp-2 text-lg font-bold text-white transition-colors group-hover:text-yellow-400">
                    {book.title || book.name}
                  </h3>
                  {authorName && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        {t("author_label", "Author")}
                      </p>
                      <p className="text-sm font-medium text-white">
                        {authorName}
                      </p>
                    </div>
                  )}
                  {pageCount !== null && (
                    <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                      <FaBookOpen size={12} />
                      <span>
                        {pageCount} {t("pages_count_label", "pages")}
                      </span>
                    </div>
                  )}
                  {shortDescription && (
                    <p className="line-clamp-3 text-sm text-gray-300">
                      {shortDescription}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {renderStars(ratingValue)}
                    </div>
                    <span className="font-semibold text-yellow-300">
                      {ratingValue > 0 ? ratingValue.toFixed(1) : "0.0"}
                    </span>
                    <span className="text-xs text-gray-500">({ratingCount})</span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <span
                    className={`text-base font-semibold ${
                      priceValue > 0 ? "text-yellow-300" : "text-green-400"
                    }`}
                  >
                    {formattedPrice}
                  </span>
                  {book.original_price &&
                    Number(book.original_price) > priceValue && (
                      <span className="text-xs text-gray-500 line-through">
                        {formatCurrency(Number(book.original_price))}
                      </span>
                    )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-400">
                  {publishedDate && (
                    <span className="rounded-full border border-gray-700 px-3 py-1">
                      {t("published_on_tag", { date: publishedDate })}
                    </span>
                  )}
                  {purchasedDate && (
                    <span className="rounded-full border border-gray-700 px-3 py-1">
                      {t("purchased_on_tag", { date: purchasedDate })}
                    </span>
                  )}
                  <span className="uppercase tracking-wide">
                    {t("marketplace_label", "Marketplace")}
                  </span>
                </div>

                <div className="mt-auto flex gap-2">
                  <button
                    aria-label={t("view_details")}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(
                        `/marketplace/books/${book.slug || book.id}`,
                      );
                    }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition"
                  >
                    {t("view_details")}
                  </button>
                  <button
                    aria-label={t("add_to_cart")}
                    onClick={async (e) => {
                      e.stopPropagation();
                      await handleAddToCart(book);
                    }}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black py-2 rounded font-medium transition"
                  >
                    {t("add_to_cart")}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <section id="books" className="bg-gray-950 py-16 text-white px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold text-center text-yellow-400 mb-4"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          📖 {t("explore_books")}
        </motion.h2>
        <p className="text-center text-gray-300 mb-10 max-w-3xl mx-auto">
          {t("discover_books")}
        </p>

        <div className="mx-auto mb-10 flex w-full max-w-6xl flex-col gap-4 rounded-2xl bg-gray-900/60 p-4 shadow-lg sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <label htmlFor="books-search" className="sr-only">
              {t("filter_search_label", "Search books")}
            </label>
            <input
              id="books-search"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("filter_search_placeholder", "Search by title or description")}
              className="w-full rounded-lg border border-gray-700 bg-gray-950/80 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400"
            />
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[150px]">
              <label htmlFor="books-category" className="sr-only">
                {t("filter_category_label", "Category")}
              </label>
              <select
                id="books-category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-950/80 px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400"
              >
                <option value="all">
                  {t("filter_category_all", "All categories")}
                </option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label htmlFor="books-language" className="sr-only">
                {t("filter_language_label", "Language")}
              </label>
              <select
                id="books-language"
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-950/80 px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400"
              >
                <option value="all">
                  {t("filter_language_all", "All languages")}
                </option>
                {availableLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label htmlFor="books-price" className="sr-only">
                {t("filter_price_label", "Price")}
              </label>
              <select
                id="books-price"
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-950/80 px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400"
              >
                <option value="all">{t("filter_price_all", "All prices")}</option>
                <option value="free">{t("filter_price_free", "Free")}</option>
                <option value="paid">{t("filter_price_paid", "Paid")}</option>
              </select>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-lg border border-yellow-400 px-3 py-2 text-sm font-medium text-yellow-300 transition hover:bg-yellow-500/10"
              >
                {t("filter_reset", "Reset")}
              </button>
            )}
          </div>
        </div>

        {renderBooksGrid()}

        <div className="text-center mt-10">
          <motion.a
            href="/marketplace/books"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-full font-semibold transition shadow-lg"
          >
            {t("explore_books")}
          </motion.a>
        </div>
      </div>
    </section>
  );
};

export default BooksSection;
