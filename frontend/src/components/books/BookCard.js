import Link from "next/link";
import { useTranslation } from "next-i18next";

export default function BookCard({
  book,
  isSelected = false,
  onSelect,
  onDelete,
  onEditLink,
  showReadLink = false,
}) {
  const { t } = useTranslation("dashboard");

  const statusClasses = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <div className="border rounded p-4 relative">
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
      {book.cover_image_url && (
        <img
          src={book.cover_image_url}
          alt={book.title}
          loading="lazy"
          className="w-full h-40 object-cover mb-2"
        />
      )}
      <h3 className="font-semibold mb-1">{book.title}</h3>
      <p className="text-sm mb-2">{`$${book.price}`}</p>
      <div className="flex gap-2">
        <Link
          href={`/marketplace/books/${book.id}`}
          className="text-blue-600 underline"
        >
          {t("view")}
        </Link>
        {showReadLink && book.pdf_url && (
          <a
            href={book.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            {t("read")}
          </a>
        )}
        {onEditLink && (
          <Link href={onEditLink} className="text-green-600 underline">
            {t("edit")}
          </Link>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="text-red-600 underline"
          >
            {t("delete")}
          </button>
        )}
      </div>
    </div>
  );
}
