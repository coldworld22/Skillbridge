import { useEffect, useState } from "react";
import { fetchReviews } from "@/services/bookReviewService";
import { useTranslation } from "next-i18next";
import RatingStars from "@/components/common/RatingStars";

export default function BookReviewList({ bookId, version = 0 }) {
  const { t } = useTranslation(["website", "common"]);
  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(0);

  useEffect(() => {
    if (!bookId) return;
    let isMounted = true;
    fetchReviews(bookId).then((data) => {
      if (!isMounted) return;
      setReviews(data.reviews || []);
      setAverage(data.averageRating || 0);
    });
    return () => {
      isMounted = false;
    };
  }, [bookId, version]);

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{t("reviews")}</h2>
        <RatingStars value={average} showValue />
      </div>
      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="bg-gray-800 p-4 rounded">
            <div className="flex items-center gap-2 mb-1">
              <RatingStars value={Number(r.rating)} size={16} />
              <span className="text-sm text-gray-300">{Number(r.rating).toFixed(1)}</span>
            </div>
            {r.comment && <p className="mt-1">{r.comment}</p>}
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-gray-400">{t("no_reviews")}</p>
        )}
      </div>
    </div>
  );
}
