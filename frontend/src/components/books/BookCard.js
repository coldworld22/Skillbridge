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
import styles from "./BookCard.module.scss";

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
    pending: styles.statusPending,
    approved: styles.statusApproved,
    rejected: styles.statusRejected,
    active: styles.statusActive,
    inactive: styles.statusInactive,
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
    <div className={`${styles.card} sm:max-w-sm`}>
      {onSelect && (
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={isSelected}
          onChange={onSelect}
        />
      )}
      {book.status && (
        <span
          className={`${styles.status} ${cornerAddToCart ? "left-2" : ""} ${
            statusClasses[book.status] || styles.statusInactive
          }`}
        >
          {t(book.status)}
        </span>
      )}
      {cornerAddToCart && onAddToCart && (
        <button
          type="button"
          onClick={onAddToCart}
          className={styles.cornerCart}
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
          className={styles.media}
          onError={() => {
            if (coverSrc !== "/images/default-book-cover.jpg") {
              setCoverSrc("/images/default-book-cover.jpg");
            }
          }}
        />
        <div className={styles.content}>
          <h3 className={`${styles.title} line-clamp-2`}>
            {book.title || book.name}
          </h3>
          {authorName && (
            <p className={styles.author}>
              {t("by_author", { author: authorName })}
            </p>
          )}
          {book.category_name && (
            <p className={styles.category}>
              {book.category_name}
            </p>
          )}
          {book.rating != null && (
            <div>
              <RatingStars value={Number(book.rating)} showValue valueClassName="text-xs text-yellow-500 dark:text-yellow-400" />
            </div>
          )}
          <p className={styles.price}>
            {formatCurrency(book.price)}
          </p>
          {owned && (
            <p className={styles.owned}>
              {t("book_owned_message", {
                defaultValue: "Already in your library",
              })}
            </p>
          )}
        </div>
        <div className={styles.actions}>
          <Link
            href={viewLink || `/marketplace/books/${book.id}`}
            className={`${styles.actionCircle} ${styles.primary}`}
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
              className={`${styles.actionCircle} ${styles.read}`}
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
              className={`${styles.actionCircle} ${styles.wishlist}`}
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
              className={`${styles.actionCircle} ${styles.cart}`}
              aria-label={t("add_to_cart")}
            >
              <FiShoppingCart />
              <span className="sr-only">{t("add_to_cart")}</span>
            </button>
          )}
          {onEditLink && (
            <Link
              href={onEditLink}
              className={`${styles.actionCircle} ${styles.edit}`}
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
              className={`${styles.actionCircle} ${styles.delete}`}
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
