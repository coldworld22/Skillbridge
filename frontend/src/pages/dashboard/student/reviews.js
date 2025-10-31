import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import StudentLayout from "@/components/layouts/StudentLayout";
import {
  FaStar,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSortAmountDown,
  FaPlus,
  FaSpinner,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchStudentReviews,
  fetchReviewableInstructors,
  createInstructorReview,
  updateInstructorReview,
  deleteInstructorReview,
  updateClassReview,
  deleteClassReview,
} from "@/services/student/reviewService";
import { toast } from "react-hot-toast";

const REVIEW_LABELS = {
  class: "Class Review",
  instructor: "Instructor Review",
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
};

export default function StudentReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [eligibleInstructors, setEligibleInstructors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    targetType: "instructor",
    instructorId: "",
    classId: null,
    rating: 0,
    comment: "",
  });

  useEffect(() => {
    loadReviews();
    loadEligibleInstructors();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await fetchStudentReviews();
      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load reviews", error);
      toast.error("Unable to load your reviews right now.");
    } finally {
      setLoading(false);
    }
  };

  const loadEligibleInstructors = async () => {
    try {
      const data = await fetchReviewableInstructors();
      setEligibleInstructors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load instructor options", error);
    }
  };

  const openNewReviewModal = () => {
    const defaultInstructor =
      eligibleInstructors.find((item) => !item.review_id) ??
      eligibleInstructors[0] ??
      null;

    setForm({
      targetType: "instructor",
      instructorId: defaultInstructor ? defaultInstructor.id : "",
      classId: null,
      rating: 0,
      comment: "",
    });
    setEditingReview(null);
    setModalOpen(true);
  };

  const handleEdit = (review) => {
    if (review.type === "class") {
      setForm({
        targetType: "class",
        instructorId: review.instructor?.id ?? "",
        classId: review.class?.id ?? null,
        rating: review.rating ?? 0,
        comment: review.comment ?? "",
      });
    } else {
      setForm({
        targetType: "instructor",
        instructorId: review.instructor?.id ?? review.targetId ?? "",
        classId: null,
        rating: review.rating ?? 0,
        comment: review.comment ?? "",
      });
    }
    setEditingReview(review);
    setModalOpen(true);
  };

  const handleDelete = async (review) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this review?"
    );
    if (!confirmed) return;

    try {
      if (review.type === "class") {
        await deleteClassReview(review.id);
      } else {
        await deleteInstructorReview(review.id);
      }
      toast.success("Review removed.");
      await Promise.all([loadReviews(), loadEligibleInstructors()]);
    } catch (error) {
      console.error("Failed to delete review", error);
      toast.error(
        error?.response?.data?.message || "Could not delete the review."
      );
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingReview(null);
    setForm((prev) => ({
      ...prev,
      targetType: "instructor",
      instructorId: "",
      classId: null,
      rating: 0,
      comment: "",
    }));
  };

  const handleRatingSelect = (value) => {
    setForm((prev) => ({
      ...prev,
      rating: value,
    }));
  };

  const handleSubmit = async () => {
    if (!form.rating) {
      toast.error("Please select a rating before submitting.");
      return;
    }

    if (form.targetType === "instructor" && !form.instructorId) {
      toast.error("Please choose an instructor to review.");
      return;
    }

    if (form.targetType === "class" && !form.classId) {
      toast.error("Missing class information for this review.");
      return;
    }

    setSubmitting(true);
    try {
      if (form.targetType === "class") {
        await updateClassReview(form.classId, {
          rating: form.rating,
          comment: form.comment,
        });
      } else if (editingReview) {
        await updateInstructorReview(editingReview.id, {
          rating: form.rating,
          comment: form.comment,
        });
      } else {
        await createInstructorReview({
          instructor_id: form.instructorId,
          rating: form.rating,
          comment: form.comment,
        });
      }
      toast.success("Review saved.");
      closeModal();
      await Promise.all([loadReviews(), loadEligibleInstructors()]);
    } catch (error) {
      console.error("Failed to submit review", error);
      toast.error(
        error?.response?.data?.message || "Could not save your review."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReviews = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const list = reviews.filter((review) => {
      if (!term) return true;
      const haystack = [
        review.targetName,
        review.instructor?.name,
        review.class?.title,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });

    return list.sort((a, b) => {
      if (sortOption === "highest") return (b.rating ?? 0) - (a.rating ?? 0);
      if (sortOption === "lowest") return (a.rating ?? 0) - (b.rating ?? 0);

      const aDate = new Date(a.updated_at || a.created_at || 0);
      const bDate = new Date(b.updated_at || b.created_at || 0);

      if (sortOption === "oldest") return aDate - bDate;
      return bDate - aDate;
    });
  }, [reviews, searchTerm, sortOption]);

  return (
    <StudentLayout>
      <div className="p-4 lg:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Reviews</h1>
            <p className="text-gray-500">
              Track your feedback for classes and instructors you&apos;ve
              worked with.
            </p>
          </div>
          <button
            onClick={openNewReviewModal}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow transition-all disabled:opacity-60"
            disabled={!eligibleInstructors.length}
            title={
              !eligibleInstructors.length
                ? "Join a class to review an instructor."
                : undefined
            }
          >
            <FaPlus />
            Rate an Instructor
          </button>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
          <div className="flex items-center gap-2 flex-1 max-w-xl border rounded px-3 py-2 bg-white shadow-sm">
            <FaSearch className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by instructor or class"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none text-sm md:text-base"
            />
          </div>
          <div className="flex items-center gap-2 border rounded px-3 py-2 bg-white shadow-sm">
            <FaSortAmountDown className="text-gray-400" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="outline-none text-sm md:text-base bg-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {loading ? (
            <div className="py-16 text-center text-gray-500">
              Loading your reviews...
            </div>
          ) : filteredReviews.length ? (
            <div className="divide-y divide-gray-100">
              {filteredReviews.map((review) => {
                const placeholder =
                  review.type === "class"
                    ? "/images/default-book-cover.jpg"
                    : "/images/default-avatar.png";
                const imageSrc =
                  review.type === "class"
                    ? review.targetAvatar || placeholder
                    : review.instructor?.avatar ||
                      review.targetAvatar ||
                      placeholder;
                const targetHref =
                  review.type === "class"
                    ? `/online-classes/${review.targetId}`
                    : `/instructors/${review.targetId}`;

                return (
                  <div
                    key={review.id}
                    className="flex flex-col md:flex-row md:items-start gap-4 p-4"
                  >
                    <img
                      src={imageSrc}
                      alt={review.targetName}
                      className="w-20 h-20 rounded-lg object-cover shadow-sm border border-gray-100"
                    />
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                        <div>
                          <Link href={targetHref}>
                            <span className="text-lg font-semibold text-blue-700 hover:underline">
                              {review.targetName || "Untitled"}
                            </span>
                          </Link>
                          <div className="flex items-center gap-2 mt-1 text-xs uppercase tracking-wide">
                            <span
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-medium ${
                                review.type === "class"
                                  ? "bg-indigo-100 text-indigo-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {REVIEW_LABELS[review.type] ?? "Review"}
                            </span>
                            <span className="text-gray-400">
                              {formatDate(review.updated_at || review.created_at)}
                            </span>
                          </div>
                          {review.type === "class" && review.instructor?.name && (
                            <p className="text-sm text-gray-500 mt-1">
                              Instructor:{" "}
                              <Link
                                href={`/instructors/${review.instructor.id}`}
                                className="text-blue-600 hover:underline"
                              >
                                {review.instructor.name}
                              </Link>
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-yellow-400 text-lg">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <FaStar
                              key={value}
                              className={
                                value <= (review.rating ?? 0)
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }
                            />
                          ))}
                        </div>
                      </div>
                      <p className="mt-3 text-gray-700 whitespace-pre-line">
                        {review.comment || "No comment provided."}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-medium">
                        <button
                          onClick={() => handleEdit(review)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                        >
                          <FaEdit /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(review)}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <FaTrash /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-gray-500">
              You have not shared any reviews yet.
            </div>
          )}
        </div>

        <AnimatePresence>
          {modalOpen && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-full max-w-xl bg-white rounded-2xl shadow-2xl p-6 space-y-5"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      {form.targetType === "class"
                        ? "Update Class Review"
                        : editingReview
                        ? "Update Instructor Review"
                        : "Rate an Instructor"}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Share honest feedback to help other learners choose the
                      right experience.
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                {form.targetType === "instructor" ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">
                      Instructor
                    </label>
                    <select
                      value={form.instructorId}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          instructorId: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    >
                      {!eligibleInstructors.length && (
                        <option value="">No instructors available</option>
                      )}
                      {eligibleInstructors.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                          {option.review_id ? " (Reviewed)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 px-3 py-3 rounded-lg text-sm text-gray-600">
                    <p>
                      Class: <strong>{editingReview?.class?.title}</strong>
                    </p>
                    {editingReview?.instructor?.name && (
                      <p>
                        Instructor:{" "}
                        <strong>{editingReview.instructor.name}</strong>
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">
                    Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        type="button"
                        key={value}
                        onClick={() => handleRatingSelect(value)}
                        className="p-1"
                        aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                      >
                        <FaStar
                          className={
                            value <= form.rating
                              ? "text-yellow-400 text-2xl"
                              : "text-gray-300 text-2xl"
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">
                    Comment
                  </label>
                  <textarea
                    rows={4}
                    value={form.comment}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        comment: e.target.value,
                      }))
                    }
                    placeholder="What stood out for you? Share any highlights or suggestions."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                    type="button"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-2 disabled:opacity-60"
                    type="button"
                    disabled={submitting}
                  >
                    {submitting && <FaSpinner className="animate-spin" />}
                    {editingReview ? "Save Changes" : "Submit Review"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </StudentLayout>
  );
}
