import { useRouter } from "next/router";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import useCartStore from "@/store/cart/cartStore";
import useAuthStore from "@/store/auth/authStore";
import useLibraryStore from "@/store/libraryStore";
import { useTranslation } from "next-i18next";
import { formatCurrency } from "@/utils/currency";
import { mapBookForCart } from "@/utils/bookMapping";
import { API_BASE_URL } from "@/config/config";
import { buildUrl } from "@/utils/url";
import RatingStars from "@/components/common/RatingStars";
import { downloadBookPdf } from "@/services/bookService";

export default function BookDetails({ book }) {
  const { t } = useTranslation(["website", "common"]);
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const { isAuthenticated, user } = useAuthStore();
  const [isAdding, setIsAdding] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const libraryBooks = useLibraryStore((state) => state.books);
  const fetchLibrary = useLibraryStore((state) => state.fetchLibrary);

  const isLoggedIn = isAuthenticated();

  const normalizedRoles = useMemo(() => {
    if (!isLoggedIn) return [];
    const roleCandidates = [];
    if (Array.isArray(user?.roles)) roleCandidates.push(...user.roles);
    if (user?.role) roleCandidates.push(user.role);
    return roleCandidates
      .map((role) =>
        typeof role === "string" ? role.toLowerCase().trim() : null
      )
      .filter(Boolean);
  }, [isLoggedIn, user?.roles, user?.role]);

  const hasRole = useMemo(() => {
    const roleSet = new Set(normalizedRoles);
    return (targetRoles) =>
      targetRoles.some((role) => roleSet.has(role.toLowerCase()));
  }, [normalizedRoles]);

  const isStudent = normalizedRoles.includes("student");
  const isInstructor = hasRole(["instructor", "instructors"]);
  const isAdmin = hasRole(["admin", "superadmin", "super_admin"]);

  const isBookCreator = useMemo(() => {
    if (!user?.id || !book) return false;
    const ownerCandidates = [
      book?.uploaded_by?.id,
      book?.instructor?.id,
      book?.instructor_id,
      book?.user_id,
      book?.owner_id,
      book?.created_by,
      book?.author_id,
      book?.creator_id,
    ]
      .flatMap((value) => {
        if (value && typeof value === "object") {
          return [value.id, value.user_id];
        }
        return [value];
      })
      .filter((value) => value !== null && value !== undefined)
      .map((value) => String(value));

    const currentUserId = String(user.id);
    return ownerCandidates.some((candidate) => candidate === currentUserId);
  }, [book, user?.id]);

  const dashboardHref = useMemo(() => {
    if (isAdmin) return "/dashboard/admin";
    if (isInstructor) return "/dashboard/instructor";
    if (isStudent) return "/dashboard/student";
    return "/dashboard";
  }, [isAdmin, isInstructor, isStudent]);

  useEffect(() => {
    if (!isStudent) return;
    fetchLibrary();
  }, [isStudent, fetchLibrary]);

  const ownedEntry = useMemo(() => {
    if (!Array.isArray(libraryBooks) || !book?.id) return null;
    return (
      libraryBooks.find((item) => String(item.id) === String(book.id)) || null
    );
  }, [libraryBooks, book]);

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      toast.info(t("please_login_to_purchase"));
      router.push("/auth/login");
      return;
    }
    if (!isStudent) {
      toast.error(t("only_students_can_purchase"));
      return;
    }
    try {
      setIsAdding(true);
      const added = await addItem(mapBookForCart(book));
      if (added) {
        toast.success(t("added_to_cart"));
        router.push("/cart");
      } else {
        toast.error(
          t("failed_to_add_to_cart", "We couldn't add this book to your cart.")
        );
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isLoggedIn) {
      toast.info(t("please_login_to_purchase"));
      router.push("/auth/login");
      return;
    }
    if (!isStudent) {
      toast.error(t("only_students_can_purchase"));
      return;
    }
    if (!book?.id) {
      toast.error(t("book_not_found"));
      return;
    }

    try {
      setIsPurchasing(true);
      const added = await addItem(mapBookForCart(book));
      if (!added) {
        toast.error(t("failed_to_add_to_cart"));
        return;
      }

      toast.success(t("book_ready_for_checkout"));
      router.push(`/payments/checkout?itemId=${book.id}&itemType=book`);
    } catch (error) {
      console.error("Failed to initiate book checkout", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("book_purchase_failed");
      toast.error(message);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleDownload = async () => {
    if (!isLoggedIn) {
      toast.info(t("please_login_to_download", "Please log in to download."));
      router.push("/auth/login");
      return;
    }
    if (!book?.id) {
      toast.error(t("book_not_found"));
      return;
    }

    const triggerBrowserDownload = (rawUrl) => {
      const resolvedUrl = buildUrl(rawUrl) || rawUrl;
      if (!resolvedUrl) throw new Error("Missing download URL");
      const anchor = document.createElement("a");
      anchor.href = resolvedUrl;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    };

    const shouldUseDirectDownload = isStudent && Boolean(downloadUrl);

    try {
      setIsDownloading(true);
      if (shouldUseDirectDownload) {
        triggerBrowserDownload(downloadUrl);
        toast.success(
          t("book_download_started", "Your download is starting..."),
        );
      } else {
        await downloadBookPdf(book.id, book.title);
        toast.success(
          t("book_download_started", "Your download is starting..."),
        );
      }
    } catch (error) {
      console.error("Failed to download book", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("book_download_failed", "We couldn't download this book. Please try again.");
      toast.error(message);
    } finally {
      setIsDownloading(false);
    }
  };

  const priceValue = Number(book?.price ?? 0);
  const isPaid =
    book?.is_paid !== undefined && book?.is_paid !== null
      ? Boolean(book.is_paid)
      : priceValue > 0;
  const userHasAccess = useMemo(
    () =>
      Boolean(book?.user_has_access) ||
      Boolean(ownedEntry) ||
      Boolean(isBookCreator),
    [book, ownedEntry, isBookCreator],
  );
  const downloadUrl = useMemo(() => {
    if (!book?.id) return null;
    if (ownedEntry?.downloadUrl) return ownedEntry.downloadUrl;
    if (book?.pdf_download_url) return buildUrl(book.pdf_download_url) || book.pdf_download_url;
    return `${API_BASE_URL}/library/download/${book.id}`;
  }, [book, ownedEntry]);
  const previewSource = book?.preview_url || ownedEntry?.preview_url;
  const hasPreview = Boolean(previewSource);

  const formatDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.valueOf())) return null;
    try {
      return new Intl.DateTimeFormat(router.locale || "en", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    } catch {
      return date.toISOString().split("T")[0];
    }
  };

  const purchaseDateLabel = ownedEntry?.purchasedAt || ownedEntry?.purchased_at;
  const publishedDateLabel =
    book?.published_at ||
    book?.publishedAt ||
    book?.created_at ||
    book?.createdAt ||
    null;
  const displayDate = formatDate(purchaseDateLabel || publishedDateLabel);

  let actionButtons = null;
  if (!isPaid) {
    actionButtons = (
      <div className="flex flex-wrap gap-4">
        {hasPreview && (
          <a
            href={previewSource}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 rounded-lg bg-yellow-500 text-gray-900 font-semibold hover:bg-yellow-400 transition-colors"
          >
            {t("preview")}
          </a>
        )}
        {downloadUrl && (
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-block px-6 py-3 rounded-lg bg-yellow-500 text-gray-900 font-semibold hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading
              ? t("downloading_book", "Preparing download...")
              : t("read_now")}
          </button>
        )}
      </div>
    );
  } else if (userHasAccess) {
    const ownershipMessage = isBookCreator
      ? t(
          "book_creator_manage_hint",
          "You created this book. Manage it from your dashboard.",
        )
      : t("book_owned_message", {
          defaultValue: "Already in your library",
        });
    actionButtons = (
      <div className="flex flex-col gap-2">
        {downloadUrl && (
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-block px-6 py-3 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading
              ? t("downloading_book", "Preparing download...")
              : t("download_book")}
          </button>
        )}
        <p className="text-sm text-green-300">
          {ownershipMessage}
        </p>
        {isBookCreator && (
          <button
            type="button"
            onClick={() => router.push(dashboardHref)}
            className="inline-block px-6 py-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
          >
            {t("common:dashboard")}
          </button>
        )}
      </div>
    );
  } else if (isLoggedIn && !isStudent) {
    actionButtons = (
      <div className="flex flex-col gap-3">
        {hasPreview && (
          <a
            href={previewSource}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 rounded-lg bg-yellow-500 text-gray-900 font-semibold hover:bg-yellow-400 transition-colors"
          >
            {t("preview")}
          </a>
        )}
        <p className="text-sm text-gray-400">
          {t("only_students_can_purchase")}
        </p>
      </div>
    );
  } else {
    actionButtons = (
      <div className="flex flex-wrap gap-4">
        {hasPreview && (
          <a
            href={previewSource}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 rounded-lg bg-yellow-500 text-gray-900 font-semibold hover:bg-yellow-400 transition-colors"
          >
            {t("preview")}
          </a>
        )}
        <button
          onClick={handleAddToCart}
          disabled={isAdding || isPurchasing}
          className="inline-block px-6 py-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("add_to_cart")}
        </button>
        <button
          onClick={handleBuyNow}
          disabled={isPurchasing || isAdding}
          className="inline-block px-6 py-3 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPurchasing ? t("processing_purchase") : t("buy_now")}
        </button>
      </div>
    );
  }

  const initialCover = useMemo(() => {
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
  }, [book?.coverUrl, book?.cover_image_url, book?.cover_image, book?.preview_pages, book?.preview_url]);

  const [coverSrc, setCoverSrc] = useState(initialCover);

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

        <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-gray-300">
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
            <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 inline-flex items-center gap-2">
              <RatingStars value={Number(book.rating)} size={16} />
              <span className="text-yellow-300/90">{Number(book.rating).toFixed(1)} / 5</span>
            </span>
          )}
          {displayDate && (
            <span className="px-2 py-1 rounded bg-gray-700/60 text-gray-300">
              {purchaseDateLabel
                ? t("purchased_on_date", { defaultValue: "Purchased on {{date}}", date: displayDate })
                : t("published_on_date", { defaultValue: "Published on {{date}}", date: displayDate })}
            </span>
          )}
        </div>

        {/* Descriptions: show short first, then detailed if present */}
        {(book.short_description || book.detailed_description || book.description) && (
          <div className="prose prose-invert max-w-none mb-6">
            {book.short_description && (
              <p className="text-gray-300">{book.short_description}</p>
            )}
            {(book.detailed_description || (!book.short_description && book.description)) && (
              <p className="mt-3">{book.detailed_description || (!book.short_description && book.description)}</p>
            )}
          </div>
        )}

        {Array.isArray(book.preview_pages) && book.preview_pages.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">{t("preview")}</h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {book.preview_pages.slice(0, 10).map((p, idx) => {
                const src = buildUrl(p) || p;
                return (
                  <a
                    key={idx}
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                    title={`${book.title || book.name} preview ${idx + 1}`}
                  >
                    <Image
                      src={src}
                      alt={`${book.title || book.name} preview ${idx + 1}`}
                      width={200}
                      height={260}
                      sizes="(max-width: 640px) 33vw, 20vw"
                      className="w-full h-auto rounded-md object-cover ring-1 ring-black/10"
                    />
                  </a>
                );
              })}
            </div>
          </div>
        )}

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
