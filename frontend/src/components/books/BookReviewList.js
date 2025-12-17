import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "next-i18next";
import RatingStars from "@/components/common/RatingStars";
import { fetchReviews } from "@/services/bookReviewService";

const deriveDisplayName = (review, anonymousLabel) => {
  const candidates = [
    review?.user_name,
    review?.reviewer_name,
    review?.reviewer_full_name,
    review?.student_name,
    review?.author_name,
    review?.name,
    review?.email,
    review?.reviewer_email,
    review?.user?.display_name,
    review?.user?.full_name,
    review?.user?.name,
    review?.user?.username,
    review?.user?.email,
    review?.student?.name,
    review?.student?.display_name,
    review?.student?.full_name,
  ]
    .map((value) => (typeof value === "string" ? value.trim() : null))
    .filter(Boolean);

  if (!candidates.length) {
    const first = [review?.first_name, review?.user?.first_name]
      .map((value) => (typeof value === "string" ? value.trim() : null))
      .find(Boolean);
    const last = [review?.last_name, review?.user?.last_name]
      .map((value) => (typeof value === "string" ? value.trim() : null))
      .find(Boolean);

    if (first || last) {
      const combined = [first, last].filter(Boolean).join(" ");
      if (combined) candidates.push(combined);
    }
  }

  return candidates[0] || anonymousLabel;
};

export default function BookReviewList({ bookId, version = 0 }) {
  const { t, i18n } = useTranslation(["website", "common"]);
  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const dateFormatter = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(i18n.language || "en", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (err) {
      console.warn("[BookReviewList] Failed to build date formatter", err);
      return null;
    }
  }, [i18n.language]);

  useEffect(() => {
    if (!bookId) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchReviews(bookId, { signal: controller.signal })
      .then((data) => {
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
        setAverage(
          Number.isFinite(Number(data.averageRating))
            ? Number(data.averageRating)
            : 0,
        );
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error("Failed to load book reviews", err);
        setError(t("failed_load_reviews"));
        setReviews([]);
        setAverage(0);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [bookId, version, t]);

  return (
    <div className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-white">
            {t("reviews", "Reviews")}
          </h2>
          <p className="text-sm text-gray-400">
            {t("average_rating_label", "Average rating")}{" "}
            <span className="font-semibold text-yellow-400">
              {average.toFixed(1)}
            </span>
          </p>
        </div>
        <RatingStars value={average} showValue valueClassName="text-sm font-semibold text-yellow-400" />
      </div>

      {loading && (
        <p className="text-gray-300">{t("loading_reviews", "Loading reviews...")}</p>
      )}

      {error && !loading && (
        <p className="text-red-400">{error}</p>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {reviews.map((review) => {
            const displayName = deriveDisplayName(
              review,
              t("anonymous_reviewer", "Anonymous"),
            );
            let formattedDate = null;
            if (review?.created_at) {
              try {
                const date = new Date(review.created_at);
                if (!Number.isNaN(date.getTime())) {
                  formattedDate = dateFormatter
                    ? dateFormatter.format(date)
                    : date.toLocaleDateString();
                }
              } catch {
                formattedDate = null;
              }
            }

            return (
              <div
                key={review.id ?? `${displayName}-${review.created_at}`}
                className="bg-gray-800 p-4 rounded border border-gray-700"
              >
                <div className="flex items-center justify-between mb-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {displayName}
                    </p>
                    {formattedDate && (
                      <p className="text-xs text-gray-400">
                        {t("reviewed_on", {
                          date: formattedDate,
                          defaultValue: `Reviewed on ${formattedDate}`,
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <RatingStars
                      value={Number(review.rating)}
                      size={16}
                      showValue
                      showSuffix={false}
                      valueClassName="text-xs font-semibold text-yellow-400"
                    />
                  </div>
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm text-gray-200 leading-relaxed">
                    {review.comment}
                  </p>
                )}
              </div>
            );
          })}

          {reviews.length === 0 && (
            <p className="text-gray-400">
              {t(
                "no_reviews",
                "No reviews yet. Be the first to share your thoughts!",
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
