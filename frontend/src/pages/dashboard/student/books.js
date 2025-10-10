import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { FiAlertCircle, FiBook, FiDownload, FiEye, FiHeart } from "react-icons/fi";
import { useTranslation } from "next-i18next";
import { toast } from "react-hot-toast";
import useLibraryStore from "@/store/libraryStore";
import useBookWishlistStore from "@/store/books/wishlistStore";
import { API_BASE_URL } from "@/config/config";
import BookCardSkeleton from "@/components/books/BookCardSkeleton";

function BookCard({ book }) {
  const { t } = useTranslation("dashboard", { keyPrefix: "booksPage" });
  const { wishlist, addToWishlist, removeFromWishlist } = useBookWishlistStore();

  const cover = book.coverUrl || book.cover_image_url || "/images/default-book-cover.jpg";
  const [imageSrc, setImageSrc] = useState(cover);

  useEffect(() => {
    setImageSrc(cover);
  }, [cover]);

  const isWishlisted = wishlist.some((item) => item.book_id === book.id);

  const price = book.price_paid ?? book.price ?? 0;
  const currency = book.currency || "USD";
  const formattedPrice = useMemo(() => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(Number(price || 0));
    } catch (err) {
      return `$${Number(price || 0).toFixed(2)}`;
    }
  }, [currency, price]);

  const handleWishlist = () => {
    if (isWishlisted) {
      removeFromWishlist(book.id);
      toast.success(t("removed_from_wishlist", { ns: "website" }));
    } else {
      addToWishlist({
        book_id: book.id,
        title: book.title,
        price: book.price_paid,
        cover_url: cover,
      });
      toast.success(t("added_to_wishlist", { ns: "website" }));
    }
  };

  return (
    <div className="border rounded-xl shadow-sm p-4 bg-white flex flex-col justify-between h-full">
      <Image
        src={imageSrc}
        alt={book.title || t("unknown_title")}
        width={400}
        height={192}
        className="w-full h-48 object-cover rounded-lg mb-4"
        onError={() => setImageSrc("/images/default-book-cover.jpg")}
      />
      <div className="flex-1">
        <h3 className="text-lg font-semibold mb-1 line-clamp-2">{book.title}</h3>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
          {book.shortDescription || book.short_description || book.description}
        </p>
        <p className="text-sm text-gray-500 mb-1">
          {book.author
            ? t("by_author", { author: book.author })
            : t("unknown_author")}
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
        {book.purchasedAt && (
          <p className="text-xs text-gray-400 mt-1">
            {t("purchased_on", {
              date: new Date(book.purchasedAt).toLocaleDateString(),
            })}
          </p>
        )}
      </div>
      <div className="mt-4 flex gap-3 flex-wrap">
        {book.preview_url && (
          <a
            href={book.preview_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-indigo-600 hover:underline"
          >
            <FiEye className="text-lg" /> {t("preview")}
          </a>
        )}
        {book.id && (
          <a
            href={`${API_BASE_URL}/library/download/${book.id}`}
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

export default function BooksPage() {
  const { t } = useTranslation("dashboard", { keyPrefix: "booksPage" });
  const { books, loading, error, fetchLibrary } = useLibraryStore();

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <BookCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50/40 p-6 text-center text-red-700">
        <FiAlertCircle className="mb-2 text-3xl" />
        <p className="font-medium">{t("error_loading")}</p>
        <button
          type="button"
          onClick={fetchLibrary}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center text-gray-600">
        <FiBook className="mb-3 text-4xl text-gray-400" />
        <p className="text-lg font-semibold">{t("no_books")}</p>
        <p className="mt-1 text-sm text-gray-500">{t("empty_hint")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
