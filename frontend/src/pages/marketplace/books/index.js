// pages/website/books/index.js
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaSearch, FaFilter, FaArrowUp } from "react-icons/fa";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import BookCard from "@/components/books/BookCard";
import BookFilterSidebar from "@/components/books/FilterSidebar";
import { fetchBooks } from "@/services/bookService";
import useBookWishlistStore from "@/store/books/wishlistStore";
import useCartStore from "@/store/cart/cartStore";
import useAuthStore from "@/store/auth/authStore";
import useLibraryStore from "@/store/libraryStore";
// Use global react-hot-toast setup from _app.js
import { toast } from "react-hot-toast";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../next-i18next.config.js";
import { mapBookForCart } from "@/utils/bookMapping";
import { BOOK_PRICE_RANGE_DEFAULT } from "@/utils/constants";
import debounce from "lodash/debounce";
import styles from "./books.module.scss";

// Fallback to a sane default if the constant is missing during build/runtime
const DEFAULT_PRICE_RANGE =
  typeof BOOK_PRICE_RANGE_DEFAULT !== "undefined"
    ? BOOK_PRICE_RANGE_DEFAULT
    : 100;

export default function BooksPage() {
  const { t } = useTranslation(["website", "common"]);
  const router = useRouter();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("default");
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  // Filters sent to the API. Backend expects single `category` and `priceRange`
  // rather than the plural keys that were previously used. Using the wrong
  // parameter names meant filtering never actually happened on the server.
  // We keep the shape here aligned with what `book.service.js` expects.
  const [filters, setFilters] = useState({
    category: "",
    priceRange: DEFAULT_PRICE_RANGE,
    language: "",
    tags: [],
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const loader = useRef(null);
  const addToWishlist = useBookWishlistStore((state) => state.addToWishlist);
  const fetchWishlist = useBookWishlistStore((state) => state.fetchWishlist);
  const clearWishlist = useBookWishlistStore((state) => state.clearWishlist);
  const wishlistHydrated = useBookWishlistStore((state) => state.hasHydrated);
  const addItem = useCartStore((state) => state.addItem);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const libraryBooks = useLibraryStore((state) => state.books);
  const fetchLibrary = useLibraryStore((state) => state.fetchLibrary);
  const hasLoadedLibrary = useRef(false);

  const isLoggedInStudent = useMemo(() => {
    if (!isAuthenticated()) return false;
    const roles = Array.isArray(user?.roles)
      ? user.roles
      : [user?.role].filter(Boolean);
    return roles.some(
      (role) =>
        typeof role === "string" && role.toLowerCase().trim() === "student"
    );
  }, [isAuthenticated, user?.roles, user?.role]);

  useEffect(() => {
    if (!isLoggedInStudent) return;
    if (hasLoadedLibrary.current) return;
    hasLoadedLibrary.current = true;
    fetchLibrary();
  }, [isLoggedInStudent, fetchLibrary]);

  useEffect(() => {
    if (!isLoggedInStudent) {
      hasLoadedLibrary.current = false;
    }
  }, [isLoggedInStudent]);

  const ownedBooksMap = useMemo(() => {
    if (!Array.isArray(libraryBooks)) return new Map();
    const entries = libraryBooks
      .filter((item) => item && item.id != null)
      .map((item) => [String(item.id), item]);
    return new Map(entries);
  }, [libraryBooks]);

  const searchDebounce = useRef(
    debounce((value) => {
      setSearchQuery(value);
      setBooks([]);
      setPage(1);
      setHasMore(true);
    }, 300)
  ).current;

  const handleSearchChange = (e) => {
    searchDebounce(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setBooks([]);
    setPage(1);
    setHasMore(true);
  };

  useEffect(() => {
    return () => {
      searchDebounce.cancel();
    };
  }, [searchDebounce]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setBooks([]);
    setPage(1);
    setHasMore(true);
  };

  const resetFilters = () => {
    setFilters({
      category: "",
      priceRange: DEFAULT_PRICE_RANGE,
      language: "",
      tags: [],
    });
    setBooks([]);
    setPage(1);
    setHasMore(true);
  };

  const isLoggedIn = isAuthenticated();

  useEffect(() => {
    if (!isLoggedIn) {
      if (wishlistHydrated) {
        clearWishlist();
      }
      return;
    }
    if (wishlistHydrated) return;
    fetchWishlist().catch(() => {});
  }, [isLoggedIn, wishlistHydrated, fetchWishlist, clearWishlist]);

  const handleAddToWishlist = async (book) => {
    if (!isLoggedIn) {
      toast.info(
        t("please_login_to_use_wishlist", {
          defaultValue: "Please log in to use your wishlist.",
        })
      );
      return;
    }
    const ok = await addToWishlist(book);
    if (ok) {
      toast.success(
        t("added_to_wishlist", { defaultValue: "Added to wishlist" })
      );
    } else {
      toast.error(
        t("failed_to_update_wishlist", {
          defaultValue: "Could not update wishlist. Please try again.",
        })
      );
    }
  };

  const handleAddToCart = async (book) => {
    if (!isAuthenticated()) {
      toast.info(
        t("please_login_to_purchase", {
          defaultValue: "Please log in to purchase books.",
        })
      );
      router.push("/auth/login");
      return;
    }

    if (!isLoggedInStudent) {
      toast.error(
        t("only_students_can_purchase", {
          defaultValue: "Only students can purchase books.",
        })
      );
      return;
    }

    const ok = await addItem(mapBookForCart(book));
    if (ok) {
      toast.success(t("added_to_cart", { defaultValue: "Added to cart" }));
    } else {
      toast.error(
        t("failed_to_add_to_cart", {
          defaultValue: "Could not add this book to your cart.",
        })
      );
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const apiFilters = {
          ...(filters.category && { category: filters.category }),
          ...(filters.priceRange !== undefined && {
            priceRange: filters.priceRange,
          }),
          ...(filters.language && { language: filters.language }),
          ...(filters.license && { license: filters.license }),
          ...(filters.tags.length && { tags: filters.tags }),
          search: searchQuery,
          status: "active",
        };

        const { books: data } = await fetchBooks({
          page,
          perPage: 6,
          filters: apiFilters,
          sort: sortBy !== "default" ? { sortBy } : {},
        });
        const normalized = data.map((b) => ({
          ...b,
          rating: b.rating != null ? Number(b.rating) : b.rating,
        }));
        setBooks((prev) => (page === 1 ? normalized : [...prev, ...normalized]));
        setHasMore(normalized.length === 6);
      } catch (err) {
        console.error(err);
        if (page === 1) {
          setError(t("failed_load_books"));
        }
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, filters, sortBy, searchQuery]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setPage((prev) => prev + 1);
      }
    });
    if (loader.current) observer.observe(loader.current);
    return () => {
      if (loader.current) observer.unobserve(loader.current);
    };
  }, [hasMore, loading]);

    if (loading && books.length === 0) {
      return (
        <div className={styles.state}>
          {t("loading_books")}
        </div>
      );
    }

  if (error && books.length === 0) {
    return (
      <div className={styles.state} style={{ color: "#f87171" }}>
        {error}
      </div>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.overlay} />
      <Navbar />

      <div className={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.hero}
        >
          <motion.h2
            className={styles.heroTitle}
            whileHover={{ scale: 1.02 }}
          >
            {t("books_marketplace_title")}
          </motion.h2>
          <p className={styles.heroSub}>
            {t("books_marketplace_description")}
          </p>
        </motion.div>

        {/* Mobile Filter & Search */}
        <div className={styles.mobileRow}>
          <div className={styles.inputWrap}>
            <FaSearch className={styles.iconLeft} />
            <input
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={t("search_books_placeholder")}
              className={styles.searchInput}
            />
          </div>
          <button
            className={styles.button}
            onClick={() => setIsFilterOpen((prev) => !prev)}
          >
            <FaFilter color="#fbbf24" />
          </button>
        </div>

        <div className={styles.layout}>
          {isFilterOpen && <div className={styles.backdrop} onClick={() => setIsFilterOpen(false)} />}
          <div className={`${styles.drawer}`} style={{ display: isFilterOpen ? "flex" : "none" }}>
            <div className={styles.drawerPanel}>
              <div className={styles.filtersHeading}>
                <h3>{t("filters")}</h3>
                <button onClick={() => setIsFilterOpen(false)} className={styles.closeBtn}>✕</button>
              </div>
              <BookFilterSidebar
                onFilterChange={handleFilterChange}
                onResetFilters={resetFilters}
              />
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.sidebarPanel}>
              <div className={styles.filtersHeading}>
                <h3>{t("filters")}</h3>
              </div>
              <BookFilterSidebar
                onFilterChange={handleFilterChange}
                onResetFilters={resetFilters}
              />
            </div>
          </div>

          <div className={styles.content}>
            <div className={styles.searchRow}>
              <div className={styles.inputWrap}>
                <FaSearch className={styles.iconLeft} />
                <input
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder={t("search_title_author_placeholder")}
                  className={styles.searchInput}
                />
              </div>

              <div className={styles.sortRow}>
                <span className={styles.muted}>{t("sort_by")}</span>
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className={styles.sortSelect}
                >
                  <option value="default">{t("sort_default")}</option>
                  <option value="price">{t("sort_price")}</option>
                  <option value="rating">{t("sort_rating")}</option>
                  <option value="newest">{t("sort_newest")}</option>
                </select>
              </div>
            </div>

            {/* Book Grid */}
            {books.length === 0 && !loading ? (
              <p className={styles.muted}>{t("no_books_found")}</p>
            ) : (
              <div className={styles.grid}>
                {books.map((book) => {
                  const ownedEntry = ownedBooksMap.get(String(book.id));
                  const isOwned = Boolean(ownedEntry);
                  return (
                    <BookCard
                      key={book.id}
                      book={book}
                      onAddToWishlist={() => handleAddToWishlist(book)}
                      onAddToCart={
                        isOwned ? undefined : () => handleAddToCart(book)
                      }
                      cornerAddToCart={!isOwned}
                      showReadLink={isOwned}
                      owned={isOwned}
                      downloadUrl={ownedEntry?.downloadUrl}
                    />
                  );
                })}
              </div>
            )}

            {loading && books.length > 0 && (
              <p className={styles.muted} style={{ textAlign: "center", marginTop: "1rem" }}>{t("loading")}</p>
            )}

            <div ref={loader} />

            {showScrollToTop && (
              <button
                onClick={() =>
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }
                className={styles.floatingBtn}
              >
                <FaArrowUp />
              </button>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </section>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "website"], nextI18NextConfig)),
    },
  };
}
