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

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow relative">
      {onSelect && (
        <input
          type="checkbox"
          className="absolute top-2 left-2"
          checked={isSelected}
          onChange={onSelect}
        />
      )}
      {book.status && (
        <span
          className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium ${
            statusClasses[book.status] || "bg-gray-100 text-gray-800"
          }`}
        >
          {t(book.status)}
        </span>
      )}
      <Image
        src={coverSrc}
        alt={book.title}
        width={400}
        height={160}
        loading="lazy"
        className="w-full h-40 object-cover"
        onError={() => {
          if (coverSrc !== "/images/default-book-cover.jpg") {
            setCoverSrc("/images/default-book-cover.jpg");
          }
        }}
      />
      <div className="p-4 text-gray-900 dark:text-gray-100">
        <h3 className="font-semibold mb-1 line-clamp-1 text-gray-900 dark:text-gray-100">{book.title || book.name}</h3>
        {(book.uploaded_by?.name || book.author) && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {t("by_author", { author: book.uploaded_by?.name || book.author })}
          </p>
        )}
        {book.category_name && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {book.category_name}
          </p>
        )}
        {book.rating != null && (
          <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-2">
            ⭐ {Number(book.rating).toFixed(1)} / 5
          </p>
        )}
        <p className="text-sm mb-3 text-gray-900 dark:text-gray-100">{formatCurrency(book.price)}</p>
        <div className="flex gap-2">
          <Link
            href={viewLink || `/marketplace/books/${book.id}`}
            className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            aria-label={t("view")}
          >
            <FiEye />
            <span className="sr-only">{t("view")}</span>
          </Link>
          {showReadLink && book.id && (
            <a
              href={`${API_BASE_URL}/library/download/${book.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
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
              className="p-2 rounded-full bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors"
              aria-label={t("wishlist")}
            >
              <FiHeart />
              <span className="sr-only">{t("wishlist")}</span>
            </button>
          )}
          {onAddToCart && (
            <button
              type="button"
              onClick={onAddToCart}
              className="p-2 rounded-full bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors"
              aria-label={t("add_to_cart")}
            >
              <FiShoppingCart />
              <span className="sr-only">{t("add_to_cart")}</span>
            </button>
          )}
          {onEditLink && (
            <Link
              href={onEditLink}
              className="p-2 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
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
              className="p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
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
