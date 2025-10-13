import { useEffect, useMemo, useState } from "react";
import { FiAlertTriangle, FiDownload, FiEye, FiHeart } from "react-icons/fi";
import { useTranslation } from "next-i18next";
import { toast } from "react-hot-toast";
import useLibraryStore from "@/store/libraryStore";
import useBookWishlistStore from "@/store/books/wishlistStore";
import { API_BASE_URL } from "@/config/config";
import BookCardSkeleton from "@/components/books/BookCardSkeleton";
import { mapBookForWishlist } from "@/utils/bookMapping";
import { buildUrl } from "@/utils/url";
import withAuthProtection from "@/hooks/withAuthProtection";
import StudentLayout from "@/components/layouts/StudentLayout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../next-i18next.config.js";

const normalizeLibraryBook = (book = {}) => {
  const rawCover =
    book.cover_image_url ||
    book.coverUrl ||
    book.cover_url ||
    book.cover_image ||
    book.cover;
  const normalizedCover = buildUrl(rawCover) || rawCover || "/images/default-book-cover.jpg";

  const rawPreview = book.preview_url || book.previewUrl;
  const previewUrl = buildUrl(rawPreview) || rawPreview || null;

  const rawDownload = book.download_url || book.pdf_url || book.file_url;
  const downloadUrl = buildUrl(rawDownload) || rawDownload || null;

  const rawTags = Array.isArray(book.tags)
    ? book.tags
    : Array.isArray(book.book_tags)
    ? book.book_tags
    : [];
  const tags = rawTags
    .map((tag) => {
      if (!tag) return null;
      if (typeof tag === "string") return tag;
      if (typeof tag === "object") {
        return tag.name || tag.label || tag.title || null;
      }
      return null;
    })
    .filter(Boolean);

  const price = Number(
    book.price !== undefined && book.price !== null ? book.price : book.price_paid ?? 0
  );
  const pricePaid = Number(
    book.price_paid !== undefined && book.price_paid !== null ? book.price_paid : price
  );

  const purchasedAt =
    book.purchasedAt || book.purchased_at || book.created_at || book.updated_at || null;

  const shortDescription =
    book.shortDescription ||
    book.short_description ||
    book.summary ||
    book.description ||
    "";

  const author =
    book.author || book.instructor_name || book.creator || book.publisher || "";

  return {
    ...book,
    cover_image_url: normalizedCover,
    coverUrl: normalizedCover,
    preview_url: previewUrl,
    previewUrl,
    downloadUrl,
    tags,
    price,
    price_paid: pricePaid,
    pricePaid,
    purchasedAt,
    shortDescription,
    author,
    isFree: book.isFree ?? pricePaid === 0,
  };
};

// Helpers to format values consistently for SSR/CSR to avoid hydration issues.
function formatCurrencyStable(value, currency, locale) {
  const num = Number(value || 0);
  try {
    return new Intl.NumberFormat(locale || "en", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    // Fallback: simple currency prefix
    const safe = Number.isFinite(num) ? num.toFixed(2) : "0.00";
    const symbol = currency === "USD" ? "$" : currency ? `${currency} ` : "$";
    return `${symbol}${safe}`;
  }
}

function formatDateUTC(dateInput, locale) {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  if (!(date instanceof Date) || Number.isNaN(date.valueOf())) return null;
  try {
    return new Intl.DateTimeFormat(locale || "en", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    }).format(date);
  } catch {
    // YYYY-MM-DD (UTC)
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
}

function BookCard({ book }) {
  const { t, i18n } = useTranslation("dashboard", { keyPrefix: "booksPage" });
  const wishlist = useBookWishlistStore((state) => state.wishlist || []);
  const addToWishlist = useBookWishlistStore((state) => state.addToWishlist);
  const removeFromWishlist = useBookWishlistStore((state) => state.removeFromWishlist);
  const [imageSrc, setImageSrc] = useState(
    book.coverUrl || book.cover_image_url || "/images/default-book-cover.jpg"
  );

  useEffect(() => {
    setImageSrc(book.coverUrl || book.cover_image_url || "/images/default-book-cover.jpg");
  }, [book.coverUrl, book.cover_image_url]);

  const isWishlisted = wishlist.some((item) => item.book_id === book.id);

  const price = book.price_paid ?? book.price ?? 0;
  const currency = book.currency || "USD";
  const formattedPrice = useMemo(() => {
    return formatCurrencyStable(price, currency, i18n?.language);
  }, [currency, price, i18n?.language]);

  const handleWishlist = () => {
    if (isWishlisted) {
      removeFromWishlist(book.id);
      toast.success(t("removed_from_wishlist", { ns: "website" }));
    } else {
      addToWishlist(mapBookForWishlist(book));
      toast.success(t("added_to_wishlist", { ns: "website" }));
    }
  };

  const downloadFallback =
    API_BASE_URL && book.id ? `${API_BASE_URL}/library/download/${book.id}` : null;
  const downloadLink = book.downloadUrl || downloadFallback;
  const previewLink = book.preview_url || null;
  const purchasedDateStr = book.purchasedAt
    ? formatDateUTC(book.purchasedAt, i18n?.language)
    : null;
  const hasValidPurchaseDate = Boolean(purchasedDateStr);
  const authorLabel =
    book.author || t("unknown_author", { ns: "dashboard", defaultValue: "Unknown author" });

  return (
    <div className="border rounded-xl shadow-sm p-4 bg-white flex flex-col justify-between h-full">
      <img
        src={imageSrc}
        alt={book.title}
        className="w-full h-48 object-cover rounded-lg mb-4"
        onError={() => setImageSrc("/images/default-book-cover.jpg")}
      />
      <div className="flex-1">
        <h3 className="text-lg font-semibold mb-1 line-clamp-2">{book.title}</h3>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
          {book.shortDescription || book.short_description || book.description}
        </p>
        <p className="text-sm text-gray-500 mb-1">
          {t("by_author", { author: authorLabel })}
        </p>
        <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
          {book.tags?.map((tag, idx) => (
            <span key={idx} className="bg-gray-100 px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          {book.isFree || Number(price) === 0 ? (
            <span className="text-green-600 font-medium">{t("free")}</span>
          ) : (
            <span className="text-blue-600 font-medium">
              {t("purchased_for_amount", { price: formattedPrice })}
            </span>
          )}
        </div>
        {hasValidPurchaseDate && (
          <p className="text-xs text-gray-400 mt-1">
            {t("purchased_on", {
              date: purchasedDateStr,
            })}
          </p>
        )}
      </div>
      <div className="mt-4 flex gap-3 flex-wrap">
        {previewLink && (
          <a
            href={previewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-indigo-600 hover:underline"
          >
            <FiEye className="text-lg" /> {t("preview")}
          </a>
        )}
        {downloadLink && (
          <a
            href={downloadLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-green-600 hover:underline"
          >
            <FiDownload className="text-lg" /> {t("download")}
          </a>
        )}
        <button
          className={`flex items-center gap-1 ${
            isWishlisted ? "text-red-500" : "text-red-400 hover:text-red-500"
          }`}
          onClick={handleWishlist}
          aria-label={
            isWishlisted
              ? t("wishlist_remove")
              : t("wishlist_add")
          }
        >
          <FiHeart />
        </button>
      </div>
    </div>
  );
}

function BooksPage() {
  const { t } = useTranslation("dashboard", { keyPrefix: "booksPage" });
  const { books, loading, error, fetchLibrary } = useLibraryStore((state) => ({
    books: state.books,
    loading: state.loading,
    error: state.error,
    fetchLibrary: state.fetchLibrary,
  }));

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const normalizedBooks = useMemo(() => {
    if (!Array.isArray(books)) return [];
    return books.map((book) => normalizeLibraryBook(book));
  }, [books]);

  const handleRetry = () => {
    fetchLibrary();
  };

  return (
    <div>
      {!loading && error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
          <div className="flex items-start gap-2">
            <FiAlertTriangle className="mt-0.5 shrink-0 text-lg" />
            <div>
              <p className="font-medium">
                {t("failed_to_load", { defaultValue: "Unable to load your library" })}
              </p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={handleRetry}
                className="mt-3 inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-800/40"
              >
                {t("retry", { ns: "common", defaultValue: "Try again" })}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <BookCardSkeleton key={index} />
          ))}
        </div>
      ) : normalizedBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          <FiEye className="mb-4 text-3xl" />
          <p className="text-base font-medium">{t("no_books")}</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("no_books_description", {
              defaultValue:
                "You haven't added any books yet. Once you purchase a book it will appear here.",
            })}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {normalizedBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}

const ProtectedBooksPage = withAuthProtection(BooksPage, ["student"]);
ProtectedBooksPage.getLayout = (page) => <StudentLayout>{page}</StudentLayout>;

export default ProtectedBooksPage;

export async function getServerSideProps(ctx) {
  const { req, locale, resolvedUrl } = ctx;
  const cookieHeader = req?.headers?.cookie || "";
  const hasRefresh = cookieHeader
    .split(";")
    .some((c) => c.trim().startsWith("refreshToken="));

  if (!hasRefresh) {
    return {
      redirect: {
        destination: `/auth/login?next=${encodeURIComponent(resolvedUrl || "/")}`,
        permanent: false,
      },
    };
  }

  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
