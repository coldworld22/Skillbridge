// pages/dashboard/instructor/reviews.js
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "next-i18next";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { FaStar, FaSpinner } from "react-icons/fa";
import { fetchInstructorReviews } from "@/services/instructor/reviewService";
import useAuthStore from "@/store/auth/authStore";
import { toast } from "react-hot-toast";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../next-i18next.config.js";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
};

const INITIAL_RATING_COUNTS = {
  5: 0,
  4: 0,
  3: 0,
  2: 0,
  1: 0,
};

export default function InstructorReviewsPage() {
  const { t } = useTranslation("dashboard");
  const user = useAuthStore((state) => state.user);
  const instructorId = user?.id;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [errorKey, setErrorKey] = useState(null);

  useEffect(() => {
    if (!instructorId) return;

    let isMounted = true;

    const loadReviews = async () => {
      setLoading(true);
      setErrorKey(null);
      try {
        const data = await fetchInstructorReviews(instructorId);
        if (!isMounted) return;
        setReviews(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load instructor reviews", err);
        setErrorKey("loadError");
        toast.error(
          err?.response?.data?.message ||
            t("instructorReviewsPage.toastError")
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadReviews();

    return () => {
      isMounted = false;
    };
  }, [instructorId, t]);

  const stats = useMemo(() => {
    if (!reviews.length) {
      return {
        average: "0.0",
        total: 0,
        counts: { ...INITIAL_RATING_COUNTS },
      };
    }

    const counts = reviews.reduce((acc, review) => {
      const rating = Math.round(Number(review.rating) || 0);
      if (rating >= 1 && rating <= 5) {
        acc[rating] = (acc[rating] || 0) + 1;
      }
      return acc;
    }, { ...INITIAL_RATING_COUNTS });

    const total = reviews.length;
    const sum = reviews.reduce(
      (acc, review) => acc + Number(review.rating || 0),
      0
    );
    const average = total ? (sum / total).toFixed(1) : "0.0";

    return { average, total, counts };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    let list = [...reviews];

    if (filter === "5") {
      list = list.filter((review) => Number(review.rating) === 5);
    } else if (filter === "4") {
      list = list.filter((review) => Number(review.rating) === 4);
    } else if (filter === "recent") {
      list = list.sort(
        (a, b) =>
          new Date(b.created_at || b.updated_at || 0) -
          new Date(a.created_at || a.updated_at || 0)
      );
    }

    return list;
  }, [reviews, filter]);

  const roundedAverage = Math.round(Number(stats.average) || 0);

  return (
    <InstructorLayout>
      <section className="py-10 px-4 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">
          {t("instructorReviewsPage.title")}
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {t("instructorReviewsPage.overallRating")}
          </h2>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="text-4xl font-bold text-yellow-500">
                {stats.average}
              </div>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((value) => (
                  <FaStar
                    key={value}
                    className={
                      value <= roundedAverage ? "text-yellow-400" : "text-gray-300"
                    }
                  />
                ))}
              </div>
              <div className="text-sm text-gray-500 ml-2">
                {t("instructorReviewsPage.reviewCount", { count: stats.total })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.counts[rating] || 0;
                const percentage = stats.total
                  ? Math.round((count / stats.total) * 100)
                  : 0;
                return (
                  <div key={rating}>
                    <div className="flex items-center justify-between text-sm font-medium text-gray-600">
                      <span>
                        {t("instructorReviewsPage.ratingBreakdown.label", {
                          count: rating,
                        })}
                      </span>
                      <span>{count}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full mt-1">
                      <div
                        className="h-full bg-yellow-400 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-6 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded transition ${
              filter === "all"
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {t("instructorReviewsPage.filters.all")}
          </button>
          <button
            onClick={() => setFilter("5")}
            className={`px-4 py-2 rounded transition ${
              filter === "5"
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {t("instructorReviewsPage.filters.rating", { count: 5 })}
          </button>
          <button
            onClick={() => setFilter("4")}
            className={`px-4 py-2 rounded transition ${
              filter === "4"
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {t("instructorReviewsPage.filters.rating", { count: 4 })}
          </button>
          <button
            onClick={() => setFilter("recent")}
            className={`px-4 py-2 rounded transition ${
              filter === "recent"
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {t("instructorReviewsPage.filters.recent")}
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500 flex flex-col items-center gap-3">
              <FaSpinner className="animate-spin text-2xl text-blue-600" />
              {t("instructorReviewsPage.loading")}
            </div>
          ) : errorKey ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-red-500">
              {t(`instructorReviewsPage.${errorKey}`)}
            </div>
          ) : !filteredReviews.length ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              {reviews.length
                ? t("instructorReviewsPage.noMatch")
                : t("instructorReviewsPage.emptyState")}
            </div>
          ) : (
            filteredReviews.map((review) => {
              const avatar =
                review.student?.avatar ||
                "/images/default-avatar.png";
              const createdAt =
                formatDate(review.created_at) ||
                formatDate(review.updated_at);

              return (
                <div
                  key={review.id}
                  className="bg-white rounded-lg shadow p-5"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <img
                      src={avatar}
                      alt={
                        review.student?.name ||
                        t("instructorReviewsPage.studentFallback")
                      }
                      className="w-12 h-12 rounded-full border object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">
                        {review.student?.name ||
                          t("instructorReviewsPage.studentFallback")}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {createdAt ||
                          t("instructorReviewsPage.recentFallback")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-400">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <FaStar
                          key={value}
                          className={
                            value <= Number(review.rating || 0)
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {review.comment ||
                      t("instructorReviewsPage.noComment")}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </section>
    </InstructorLayout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["dashboard"],
        nextI18NextConfig
      )),
    },
  };
}
