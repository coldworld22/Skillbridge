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
      toast.error(t("please_login_to_review", "Please log in to leave a review."));
      return;
    }
    if (!comment.trim()) {
      toast.error(
        t(
          "comment_required",
          "Please share a few words about your experience before submitting.",
        ),
      );
      return;
    }

    try {
      setLoading(true);
      await createReview({ book_id: bookId, rating, comment: comment.trim() });
      setRating(5);
      setComment("");
      toast.success(
        t("review_submitted", "Thanks! Your review has been submitted."),
      );
      onSubmitted?.();
    } catch (error) {
      console.error("Failed to submit review", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t(
          "review_submit_failed",
          "We couldn't submit your review. Please try again.",
        );
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4 bg-gray-800/60 p-6 rounded-xl border border-gray-700">
      <h3 className="text-lg font-semibold text-white">
        {t("write_review", "Write a review")}
      </h3>
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-200">
          {t("rating_label", "Rating")}
        </label>
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="text-gray-900 p-2 rounded w-full"
          aria-label={t("rating_label", "Rating")}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-200">
          {t("comment_label", "Comment")}
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full p-3 rounded text-gray-900 resize-y min-h-[120px]"
          placeholder={t(
            "comment_placeholder",
            "Share what you liked, what could improve, or how the book helped you.",
          )}
          aria-label={t("comment_label", "Comment")}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? t("submitting_review", "Submitting...")
          : t("submit_review", "Submit review")}
      </button>
    </form>
  );
}
