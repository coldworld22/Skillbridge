import { useEffect, useState } from "react";
import { fetchReviews } from "@/services/bookReviewService";
import { useTranslation } from "next-i18next";

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
      <h2 className="text-xl font-semibold mb-4">
        {t("reviews")}: {average.toFixed(1)} / 5
      </h2>
      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="bg-gray-800 p-4 rounded">
            <p className="text-yellow-400">⭐ {r.rating}</p>
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
