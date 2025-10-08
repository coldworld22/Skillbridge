import { useEffect } from "react";
import Image from "next/image";
import { FiDownload, FiEye, FiHeart } from "react-icons/fi";
import { useTranslation } from "next-i18next";
import { toast } from "react-hot-toast";
import useLibraryStore from "@/store/libraryStore";
import useBookWishlistStore from "@/store/books/wishlistStore";
import { API_BASE_URL } from "@/config/config";

function BookCard({ book }) {
  const { t } = useTranslation("dashboard", { keyPrefix: "booksPage" });
  const { wishlist, addToWishlist, removeFromWishlist } = useBookWishlistStore();

  const cover = book.coverUrl || "/images/default-book-cover.jpg";

  const isWishlisted = wishlist.some((item) => item.book_id === book.id);

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
        src={cover}
        alt={book.title}
        width={400}
        height={192}
        className="w-full h-48 object-cover rounded-lg mb-4"
      />
      <div className="flex-1">
        <h3 className="text-lg font-semibold mb-1 line-clamp-2">{book.title}</h3>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{book.shortDescription}</p>
        <p className="text-sm text-gray-500 mb-1">
          {t("by_author", { author: book.author })}
        </p>
        <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
          {book.tags?.map((tag, idx) => (
            <span key={idx} className="bg-gray-100 px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          {book.isFree ? (
            <span className="text-green-600 font-medium">{t("free")}</span>
          ) : (
            <span className="text-blue-600 font-medium">
              {t("purchased_for", { price: book.price_paid })}
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
        {
          <a
            href={`${API_BASE_URL}/library/download/${book.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-green-600 hover:underline"
          >
            <FiDownload className="text-lg" /> {t("download")}
          </a>
        }
        <button
          className={
            isWishlisted ? "text-red-500" : "text-red-400 hover:text-red-500"
          }
          onClick={handleWishlist}
          aria-label={t("wishlist", { ns: "common" })}
        >
          <FiHeart />
        </button>
      </div>
    </div>
  );
}

export default function BooksPage() {
  const { t } = useTranslation("dashboard", { keyPrefix: "booksPage" });
  const { books, fetchLibrary } = useLibraryStore();

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {books.length === 0 ? (
        <p className="text-gray-500">{t("no_books")}</p>
      ) : (
        books.map((book) => <BookCard key={book.id} book={book} />)
      )}
    </div>
  );
}
