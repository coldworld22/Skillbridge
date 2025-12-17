import React, { useEffect, useMemo, useState } from "react";
import { FiAlertTriangle, FiDownload, FiEye, FiHeart } from "react-icons/fi";
import { useTranslation } from "next-i18next";
import { toast } from "react-hot-toast";
import useLibraryStore from "@/store/libraryStore";
import useBookWishlistStore from "@/store/books/wishlistStore";
import { API_BASE_URL } from "@/config/config";
import BookCardSkeleton from "@/components/books/BookCardSkeleton";
import { buildUrl } from "@/utils/url";
import withAuthProtection from "@/hooks/withAuthProtection";
import StudentLayout from "@/components/layouts/StudentLayout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../next-i18next.config.js";
// dynamic rendering not required now; we handle hydration explicitly

const coerceText = (value, lang = "en") => {
  if (value == null) return "";
  const t = typeof value;
  if (t === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") return "";
    return trimmed;
  }
  if (t === "number" || t === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((v) => coerceText(v, lang)).filter(Boolean).join(", ");
  if (t === "object") {
    if (value instanceof Date) return value.toISOString();
    if (value[lang] && typeof value[lang] === "string") return value[lang];
    if (value.en && typeof value.en === "string") return value.en;
    const firstString = Object.values(value).find((v) => typeof v === "string");
    if (firstString) return firstString;
  }
  return "";
};

const coerceUrl = (value, lang = "en") => {
  if (!value) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const lower = trimmed.toLowerCase();
    if (lower === "null" || lower === "undefined" || lower === "false") return null;
    return trimmed;
  }
  if (typeof value === "object") {
    if (typeof value.url === "string") return value.url;
    if (typeof value.href === "string") return value.href;
    const localized = value[lang];
    if (typeof localized === "string") return localized;
    const english = value.en;
    if (typeof english === "string") return english;
  }
  return coerceText(value, lang) || null;
};

const normalizeLibraryBook = (rawBook, lang = "en") => {
  if (!rawBook || typeof rawBook !== "object" || Array.isArray(rawBook)) {
    return null;
  }

  const book = rawBook;
  const rawCover =
    book.cover_image_url ||
    book.coverUrl ||
    book.cover_url ||
    book.cover_image ||
    book.cover;
  const rawPreview = book.preview_url || book.previewUrl;
  let previewCandidate = coerceUrl(rawPreview, lang);
  if (!previewCandidate && Array.isArray(book.preview_pages)) {
    for (const page of book.preview_pages) {
      const resolved = coerceUrl(page, lang);
      if (resolved) {
        previewCandidate = resolved;
        break;
      }
    }
  }
  const previewUrl =
    (typeof previewCandidate === "string" && buildUrl(previewCandidate)) ||
    previewCandidate ||
    null;
  const coverCandidate = coerceUrl(rawCover, lang);
  const normalizedCover =
    (typeof coverCandidate === "string" && buildUrl(coverCandidate)) ||
    coverCandidate ||
    previewUrl ||
    "/images/default-book-cover.jpg";

  const fallbackId =
    book.id ??
    book.book_id ??
    book.bookId ??
    book.library_id ??
    book.libraryId ??
    null;
  const rawDownload =
    book.downloadUrl ||
    book.download_url ||
    book.pdf_url ||
    book.file_url;
  const downloadCandidate = coerceUrl(rawDownload, lang);
  const fallbackDownload =
    fallbackId && API_BASE_URL
      ? `${String(API_BASE_URL).replace(/\/$/, "")}/library/download/${fallbackId}`
      : null;
  const downloadUrl =
    (typeof downloadCandidate === "string" && buildUrl(downloadCandidate)) ||
    downloadCandidate ||
    (fallbackDownload && buildUrl(fallbackDownload)) ||
    null;

  const rawTags = Array.isArray(book.tags)
    ? book.tags
    : Array.isArray(book.book_tags)
    ? book.book_tags
    : toArray(book.tags || book.book_tags);
  const tags = rawTags
    .map((tag) => {
      if (!tag) return null;
      return coerceText(tag.name ?? tag.label ?? tag.title ?? tag, lang);
    })
    .filter((tag) => typeof tag === "string" && tag.trim().length > 0);

  const price = Number(
    book.price !== undefined && book.price !== null ? book.price : book.price_paid ?? 0
  );
  const pricePaid = Number(
    book.price_paid !== undefined && book.price_paid !== null ? book.price_paid : price
  );

  const purchasedAt =
    book.purchasedAt || book.purchased_at || book.created_at || book.updated_at || null;

  const title = coerceText(book.title || book.name || book.book_title, lang) || "";

  const shortDescription = coerceText(
    book.shortDescription ||
      book.short_description ||
      book.summary ||
      book.description,
    lang
  );

  const author = coerceText(
    book.author || book.instructor_name || book.creator || book.publisher,
    lang
  );

  const id = fallbackId;

  return {
    ...book,
    id,
    title,
    cover_image_url: normalizedCover,
    coverUrl: normalizedCover,
    preview_url: previewUrl,
    previewUrl,
    downloadUrl,
    download_url: downloadUrl,
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

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (value instanceof Set) return Array.from(value).filter(Boolean);
  if (value instanceof Map) return Array.from(value.values()).filter(Boolean);
  if (typeof value === "string") {
    const parts = value
      .split(/[,;]+/)
      .map((part) => part.trim())
      .filter(Boolean);
    return parts.length ? parts : [value];
  }
  return [value].filter(Boolean);
}

function BookCard({ book }) {
  const { t, i18n } = useTranslation("dashboard", { keyPrefix: "booksPage" });
  const { t: tWebsite } = useTranslation("website");
  const wishlist = useBookWishlistStore((state) =>
    Array.isArray(state.wishlist) ? state.wishlist : []
  );
  const addToWishlist = useBookWishlistStore((state) => state.addToWishlist);
  const removeFromWishlist = useBookWishlistStore((state) => state.removeFromWishlist);
  const resolveCover = () =>
    buildUrl(book.coverUrl) ||
    buildUrl(book.cover_image_url) ||
    buildUrl(book.cover_image) ||
    buildUrl(book.cover) ||
    (Array.isArray(book.preview_pages) &&
      book.preview_pages
        .map((entry) => buildUrl(coerceUrl(entry, i18n?.language)))
        .find(Boolean)) ||
    buildUrl(book.previewUrl) ||
    buildUrl(book.preview_url) ||
    book.coverUrl ||
    book.cover_image_url ||
    book.previewUrl ||
    book.preview_url ||
    "/images/default-book-cover.jpg";

  const [imageSrc, setImageSrc] = useState(resolveCover);

  useEffect(() => {
    setImageSrc(resolveCover());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    book.coverUrl,
    book.cover_image_url,
    book.cover_image,
    book.cover,
    book.previewUrl,
    book.preview_url,
  ]);

  const isWishlisted = wishlist.some((item) => item?.book_id === book.id);

  const price = book.price_paid ?? book.price ?? 0;
  const currency = book.currency || "USD";
  const formattedPrice = useMemo(() => {
    return formatCurrencyStable(price, currency, i18n?.language);
  }, [currency, price, i18n?.language]);

  const handleWishlist = async () => {
    if (isWishlisted) {
      const ok = await removeFromWishlist(book.id);
      if (ok) {
        toast.success(tWebsite("removed_from_wishlist"));
      } else {
        toast.error(
          t("failed_to_update_wishlist", {
            defaultValue: "Could not update your wishlist. Please try again.",
          })
        );
      }
    } else {
      const ok = await addToWishlist(book);
      if (ok) {
        toast.success(tWebsite("added_to_wishlist"));
      } else {
        toast.error(
          t("failed_to_update_wishlist", {
            defaultValue: "Could not update your wishlist. Please try again.",
          })
        );
      }
    }
  };

  const downloadLink = book.downloadUrl || book.download_url || null;
  const previewLink = book.preview_url || null;
  const purchasedDateStr = book.purchasedAt
    ? formatDateUTC(book.purchasedAt, i18n?.language)
    : null;
  const hasValidPurchaseDate = Boolean(purchasedDateStr);
  const authorLabel =
    coerceText(book.author, i18n?.language) ||
    t("unknown_author", { ns: "dashboard", defaultValue: "Unknown author" });

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-md transition-shadow hover:shadow-lg">
      <img
        src={imageSrc}
        alt={coerceText(book.title, i18n?.language) || "Book"}
        className="h-56 w-full rounded-xl object-cover"
        onError={() => setImageSrc("/images/default-book-cover.jpg")}
      />
      <div className="flex flex-1 flex-col gap-3">
        <div>
          <h3 className="text-lg font-semibold leading-tight line-clamp-2">
            {coerceText(book.title, i18n?.language) ||
              t("unknown_title", { ns: "dashboard", defaultValue: "Untitled" })}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t("by_author", { author: authorLabel })}
          </p>
        </div>
        <p className="text-sm text-gray-600 line-clamp-3">
          {coerceText(book.shortDescription || book.short_description || book.description, i18n?.language)}
        </p>
        <div className="flex flex-wrap gap-2">
          {book.tags?.map((tag, idx) => {
            const label = coerceText(tag, i18n?.language);
            if (!label) return null;
            return (
              <span key={idx} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                {label}
              </span>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex flex-col gap-1">
          {book.isFree || Number(price) === 0 ? (
            <span className="text-green-600 font-semibold">{t("free")}</span>
          ) : (
            <span className="text-blue-600 font-semibold">
              {t("purchased_for_amount", { price: formattedPrice })}
            </span>
          )}
          {hasValidPurchaseDate && (
            <span className="text-xs text-gray-400">
              {t("purchased_on", {
                date: purchasedDateStr,
              })}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {previewLink && (
            <a
              href={previewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-medium text-indigo-600 hover:underline"
            >
              <FiEye className="text-lg" /> {t("preview")}
            </a>
          )}
          {downloadLink && (
            <a
              href={downloadLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-medium text-green-600 hover:underline"
            >
              <FiDownload className="text-lg" /> {t("download")}
            </a>
          )}
          <button
            className={`flex items-center gap-1 font-medium ${
              isWishlisted ? "text-red-500" : "text-red-400 hover:text-red-500"
            }`}
            onClick={handleWishlist}
            aria-label={
              isWishlisted
                ? t("wishlist_remove", { defaultValue: "Remove from wishlist" })
                : t("wishlist_add", { defaultValue: "Add to wishlist" })
            }
          >
            <FiHeart />
          </button>
        </div>
      </div>
    </div>
  );
}

function BooksPage() {
  const { t, i18n } = useTranslation("dashboard", { keyPrefix: "booksPage" });
  const books = useLibraryStore((state) => state.books);
  const loading = useLibraryStore((state) => state.loading);
  const error = useLibraryStore((state) => state.error);
  const fetchLibrary = useLibraryStore((state) => state.fetchLibrary);
  const fetchWishlist = useBookWishlistStore((state) => state.fetchWishlist);
  const wishlistHydrated = useBookWishlistStore((state) => state.hasHydrated);

  // Keep SSR/CSR markup consistent to avoid hydration errors.
  const [mounted, setMounted] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  useEffect(() => setMounted(true), []);
  const isServer = typeof window === "undefined";
  const uiLoading = isServer || !mounted ? true : loading;

  useEffect(() => {
    if (hasRequested) return;
    setHasRequested(true);
    fetchLibrary();
  }, [hasRequested, fetchLibrary]);

  useEffect(() => {
    if (wishlistHydrated) return;
    fetchWishlist().catch(() => {});
  }, [wishlistHydrated, fetchWishlist]);

  const normalizedBooks = useMemo(() => {
    if (!Array.isArray(books)) return [];
    const lang = i18n?.language;
    return books
      .map((book) => normalizeLibraryBook(book, lang))
      .filter(Boolean);
  }, [books, i18n?.language]);

  const handleRetry = () => {
    fetchLibrary();
  };

  if (!mounted) {
    // Avoid rendering on the server / before client hydration
    // to prevent any SSR/CSR mismatches on this page.
    return null;
  }

  return (
    <div>
      {!uiLoading && error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
          <div className="flex items-start gap-2">
            <FiAlertTriangle className="mt-0.5 shrink-0 text-lg" />
            <div>
              <p className="font-medium">
                {t("failed_to_load", { defaultValue: "Unable to load your library" })}
              </p>
              <p className="mt-1">{String(error || "")}</p>
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

      {uiLoading ? (
        <div className="mx-auto w-full max-w-6xl">
          <div className="grid justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="w-full max-w-md">
                <BookCardSkeleton />
              </div>
            ))}
          </div>
        </div>
      ) : normalizedBooks.length === 0 ? (
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          <FiEye className="mb-4 text-3xl" />
          <p className="text-base font-medium">{t("no_books")}</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("no_books_description", {
              defaultValue:
                "You haven't added any books yet. Once you purchase a book it will appear here.",
            })}
          </p>
        </div>
      ) : normalizedBooks.length === 1 ? (
        <BookCardBoundary key={String(normalizedBooks[0]?.id ?? 0)} book={normalizedBooks[0]}>
          <div className="mx-auto w-full max-w-2xl">
            <BookCard book={normalizedBooks[0]} />
          </div>
        </BookCardBoundary>
      ) : (
        <div className="mx-auto w-full max-w-6xl">
          <div className="grid justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {normalizedBooks.map((book, index) => (
              <BookCardBoundary key={String(book?.id ?? index)} book={book}>
                <BookCard book={book} />
              </BookCardBoundary>
            ))}
          </div>
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
      ...(await serverSideTranslations(locale, ["dashboard", "common", "website"], nextI18NextConfig)),
    },
  };
}

class BookCardBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    try {
      // Log the whole book object to help trace invalid fields
      // without breaking the page.
      // eslint-disable-next-line no-console
      console.error("Error rendering book card", { error, info, book: this.props.book });
    } catch {}
  }
  render() {
    if (this.state.hasError) {
      const lang = this.props?.i18n?.language;
      const title = coerceText(this.props.book?.title, lang) || "Invalid book";
      return (
        <div className="border rounded-xl shadow-sm p-4 bg-white text-sm text-red-600">
          {title}
        </div>
      );
    }
    return this.props.children;
  }
}
