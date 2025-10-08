import { useState } from "react";
import { createReview } from "@/services/bookReviewService";
import useAuthStore from "@/store/auth/authStore";
import { toast } from "react-hot-toast";
import { useTranslation } from "next-i18next";

export default function BookReviewForm({ bookId, onSubmitted }) {
  const { isAuthenticated } = useAuthStore();
  const { t } = useTranslation(["website", "common"]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated()) {
      toast.error(t("please_login_to_review"));
      return;
    }
    try {
      setLoading(true);
      await createReview({ book_id: bookId, rating, comment });
      setRating(5);
      setComment("");
      toast.success(t("review_submitted"));
      onSubmitted?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <h3 className="text-lg font-semibold">{t("write_review")}</h3>
      <div>
        <label className="block mb-1">{t("rating")}</label>
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="text-gray-900 p-2 rounded"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block mb-1">{t("comment")}</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full p-2 rounded text-gray-900"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {t("submit")}
      </button>
    </form>
  );
}
