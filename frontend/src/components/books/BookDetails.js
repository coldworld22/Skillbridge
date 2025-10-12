import { useRouter } from "next/router";
import Image from "next/image";
import { useState } from "react";
import { toast } from "react-hot-toast";
import useCartStore from "@/store/cart/cartStore";
import useAuthStore from "@/store/auth/authStore";
import { useTranslation } from "next-i18next";
import { formatCurrency } from "@/utils/currency";
import { mapBookForCart } from "@/utils/bookMapping";
import { API_BASE_URL } from "@/config/config";
import { buildUrl } from "@/utils/url";

export default function BookDetails({ book }) {
  const { t } = useTranslation(["website", "common"]);
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const { isAuthenticated, user } = useAuthStore();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    if (!isAuthenticated()) {
      toast.info(t("please_login_to_purchase"));
      router.push("/auth/login");
      return;
    }
    if (user?.role?.toLowerCase() !== "student") {
      toast.error(t("only_students_can_purchase"));
      return;
    }
    try {
      setIsAdding(true);
      await addItem(mapBookForCart(book));
      toast.success(t("added_to_cart"));
      router.push("/cart");
    } finally {
      setIsAdding(false);
    }
  };

  const priceValue = Number(book?.price ?? 0);
  const isPaid =
    book?.is_paid !== undefined && book?.is_paid !== null
      ? Boolean(book.is_paid)
      : priceValue > 0;
  const userHasAccess = Boolean(book?.user_has_access);
  const downloadUrl = book?.id
    ? `${API_BASE_URL}/library/download/${book.id}`
    : null;
  const hasPreview = Boolean(book?.preview_url);

  let actionButtons = null;
  if (!isPaid) {
    actionButtons = (
      <div className="flex flex-wrap gap-4">
        {hasPreview && (
          <a
            href={book.preview_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 rounded-lg bg-yellow-500 text-gray-900 font-semibold hover:bg-yellow-400 transition-colors"
          >
            {t("preview")}
          </a>
        )}
        {downloadUrl && (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 rounded-lg bg-yellow-500 text-gray-900 font-semibold hover:bg-yellow-400 transition-colors"
          >
            {t("read_now")}
          </a>
        )}
      </div>
    );
  } else if (userHasAccess) {
    if (downloadUrl) {
      actionButtons = (
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-3 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
        >
          {t("download_book")}
        </a>
      );
    }
  } else {
    actionButtons = (
      <div className="flex flex-wrap gap-4">
        {hasPreview && (
          <a
            href={book.preview_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 rounded-lg bg-yellow-500 text-gray-900 font-semibold hover:bg-yellow-400 transition-colors"
          >
            {t("preview")}
          </a>
        )}
        <button
          onClick={handleAddToCart}
          disabled={isAdding}
          className="inline-block px-6 py-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("add_to_cart")}
        </button>
      </div>
    );
  }

  const [coverSrc, setCoverSrc] = useState(() => {
    const previewFirst = Array.isArray(book?.preview_pages) && book.preview_pages.length > 0
      ? book.preview_pages[0]
      : book?.preview_url;
    const candidates = [
      book?.coverUrl,
      book?.cover_image_url,
      book?.cover_image,
      previewFirst,
    ];
    for (const c of candidates) {
      const u = buildUrl(c) || c;
      if (u) return u;
    }
    return "/images/default-book-cover.jpg";
  });

  return (
    <div className="flex flex-col md:flex-row gap-8 bg-gray-800/60 p-6 rounded-xl shadow-lg">
      <div className="md:w-1/3 w-full">
        <Image
          src={coverSrc}
          alt={book.title || book.name}
          width={600}
          height={900}
          priority
          sizes="(max-width: 768px) 100vw, 33vw"
          className="w-full rounded-lg object-cover shadow-md ring-1 ring-black/10"
          onError={() => {
            if (coverSrc !== "/images/default-book-cover.jpg") {
              setCoverSrc("/images/default-book-cover.jpg");
            }
          }}
        />
      </div>

      <div className="flex-1">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">{book.title || book.name}</h1>
        {book.author && (
          <p className="text-yellow-400 mb-4">{t("by_author", { author: book.author })}</p>
        )}

        <div className="flex flex-wrap gap-3 mb-4 text-xs">
          {book.category_name && (
            <span className="px-2 py-1 rounded bg-gray-700/60 text-gray-300 uppercase tracking-wide">
              {book.category_name}
            </span>
          )}
          {book.language && (
            <span className="px-2 py-1 rounded bg-gray-700/60 text-gray-300 uppercase tracking-wide">
              {book.language}
            </span>
          )}
          {book.rating != null && (
            <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-400">
              ⭐ {Number(book.rating).toFixed(1)} / 5
            </span>
          )}
        </div>

        <div className="prose prose-invert max-w-none mb-6">
          <p>
            {book.detailed_description || book.short_description || book.description}
          </p>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <p className="text-2xl font-bold">
            {Number(book.price) > 0 ? formatCurrency(book.price) : t("free")}
          </p>
          {actionButtons}
        </div>
      </div>
    </div>
  );
}
