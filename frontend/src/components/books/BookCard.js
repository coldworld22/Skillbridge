import Image from "next/image";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import {
  FiEye,
  FiBookOpen,
  FiEdit,
  FiTrash2,
  FiHeart,
  FiShoppingCart,
} from "react-icons/fi";
import { buildUrl } from "@/utils/url";
import RatingStars from "@/components/common/RatingStars";
import { formatCurrency } from "@/utils/currency";
import { API_BASE_URL } from "@/config/config";

export default function BookCard({
  book,
  isSelected = false,
  onSelect,
  onDelete,
  onEditLink,
  showReadLink = false,
  viewLink,
  onAddToWishlist,
  onAddToCart,
  cornerAddToCart = false,
  owned = false,
  downloadUrl,
}) {
  const { t } = useTranslation("website");

  const initialCover = useMemo(() => {
    const previewFirst = Array.isArray(book.preview_pages) && book.preview_pages.length > 0
      ? book.preview_pages[0]
      : book.preview_url;
    const candidates = [book.coverUrl, book.cover_image_url, book.cover_image, previewFirst];
    for (const c of candidates) {
      const u = buildUrl(c) || c;
      if (u) return u;
    }
    return "/images/default-book-cover.jpg";
  }, [book.coverUrl, book.cover_image_url, book.cover_image]);
  const [coverSrc, setCoverSrc] = useState(initialCover);

  const statusClasses = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
  };

  const finalDownloadUrl =
    downloadUrl ||
    book.download_url ||
    book.pdf_url ||
    (book.id ? `${API_BASE_URL}/library/download/${book.id}` : null);

  const rawAuthor =
    typeof book.author === "string" && book.author.trim()
      ? book.author
      : book.uploaded_by?.name;
  const authorName =
    typeof rawAuthor === "string" && rawAuthor.trim() && rawAuthor.trim().toLowerCase() !== "unknown"
      ? rawAuthor.trim()
      : null;

  return (
    <div className="relative flex h-full w-full max-w-xs flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm transition-shadow hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 sm:max-w-sm">
      {onSelect && (
        <input
          type="checkbox"
          className="absolute left-3 top-3"
          checked={isSelected}
          onChange={onSelect}
        />
      )}
      {book.status && (
        <span
          className={`absolute top-2 ${cornerAddToCart ? "left-2" : "right-2"} px-2 py-0.5 rounded text-xs font-medium ${
            statusClasses[book.status] || "bg-gray-100 text-gray-800"
          }`}
        >
          {t(book.status)}
        </span>
      )}
      {cornerAddToCart && onAddToCart && (
        <button
          type="button"
          onClick={onAddToCart}
          className="absolute top-2 right-2 p-2 rounded-full bg-yellow-500 text-gray-900 hover:bg-yellow-400 transition-colors shadow-md"
          aria-label={t("add_to_cart")}
          title={t("add_to_cart")}
        >
          <FiShoppingCart />
        </button>
      )}
      <div className="flex flex-col gap-4">
        <Image
          src={coverSrc}
          alt={book.title}
          width={400}
          height={200}
          loading="lazy"
          className="h-48 w-full rounded-xl object-cover"
          onError={() => {
            if (coverSrc !== "/images/default-book-cover.jpg") {
              setCoverSrc("/images/default-book-cover.jpg");
            }
          }}
        />
        <div className="flex flex-1 flex-col items-center gap-2 text-gray-900 dark:text-gray-100">
          <h3 className="text-lg font-semibold leading-snug line-clamp-2">
            {book.title || book.name}
          </h3>
          {authorName && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("by_author", { author: authorName })}
            </p>
          )}
          {book.category_name && (
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {book.category_name}
            </p>
          )}
          {book.rating != null && (
            <div>
              <RatingStars value={Number(book.rating)} showValue valueClassName="text-xs text-yellow-500 dark:text-yellow-400" />
            </div>
          )}
          <p className="text-base font-semibold text-blue-600 dark:text-blue-300">
            {formatCurrency(book.price)}
          </p>
          {owned && (
            <p className="text-xs font-medium uppercase text-green-600 dark:text-green-400">
              {t("book_owned_message", {
                defaultValue: "Already in your library",
              })}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={viewLink || `/marketplace/books/${book.id}`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100"
            aria-label={t("view")}
          >
            <FiEye />
            <span className="sr-only">{t("view")}</span>
          </Link>
          {showReadLink && finalDownloadUrl && (
            <a
              href={finalDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition-colors hover:bg-indigo-100"
              aria-label={t("read")}
            >
              <FiBookOpen />
              <span className="sr-only">{t("read")}</span>
            </a>
          )}
          {onAddToWishlist && (
            <button
              type="button"
              onClick={onAddToWishlist}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-50 text-pink-600 transition-colors hover:bg-pink-100"
              aria-label={t("wishlist")}
            >
              <FiHeart />
              <span className="sr-only">{t("wishlist")}</span>
            </button>
          )}
          {onAddToCart && !cornerAddToCart && (
            <button
              type="button"
              onClick={onAddToCart}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-50 text-yellow-600 transition-colors hover:bg-yellow-100"
              aria-label={t("add_to_cart")}
            >
              <FiShoppingCart />
              <span className="sr-only">{t("add_to_cart")}</span>
            </button>
          )}
          {onEditLink && (
            <Link
              href={onEditLink}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600 transition-colors hover:bg-green-100"
              aria-label={t("edit")}
            >
              <FiEdit />
              <span className="sr-only">{t("edit")}</span>
            </Link>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 transition-colors hover:bg-red-100"
              aria-label={t("delete")}
            >
              <FiTrash2 />
              <span className="sr-only">{t("delete")}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
