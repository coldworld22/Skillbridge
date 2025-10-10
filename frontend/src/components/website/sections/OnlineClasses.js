import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  FaSearch,
  FaCalendarAlt,
  FaVideo,
  FaHeart,
  FaThumbsUp,
  FaUsers,
  FaBookOpen,
} from "react-icons/fa";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import {
  fetchPublishedClasses,
  addClassToWishlist,
  removeClassFromWishlist,
  likeClass,
  unlikeClass,
  getMyClassWishlist,
  getMyLikedClasses,
} from "@/services/classService";
import useAuthStore from "@/store/auth/authStore";
import { toast } from "react-toastify";
import { formatCurrency } from "@/utils/currency";

const initialCategories = ["All", "Trending"];

const computeStatus = (start, end) => {
  const now = new Date();
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;
  if (s && now < s) return "Upcoming";
  if (s && (!e || now <= e) && now >= s) return "Live";
  if (e && now > e) return "Completed";
  return "Upcoming";
};

const statusRank = { Live: 0, Upcoming: 1, Completed: 2 };

const OnlineClasses = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showLiveClasses, setShowLiveClasses] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const [classes, setClasses] = useState([]);
  const [categories, setCategories] = useState(initialCategories);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [likedIds, setLikedIds] = useState([]);
  const [actionLoading, setActionLoading] = useState({});

  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isStudent = user?.role?.toLowerCase() === "student";
  const { t } = useTranslation(["website", "dashboard"]);

  const classesLoadFailed = t("classes_load_failed", { ns: "dashboard" });
  const studentsOnlyLike = t("like_students_only");
  const studentsOnlySave = t("save_students_only");
  const toggleLikeError = t("toggle_like_error");
  const toggleWishlistError = t("toggle_wishlist_error");
  const retryLabel = t("retry", { ns: "dashboard" });
  const resetFiltersLabel = t("reset_filters");
  const freeLabel = t("free");
  const noResultsLabel = t("no_classes_match_filters", { ns: "dashboard" });

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchPublishedClasses();
        const list = res?.data ?? [];
        const formatted = list.map((item) => {
          const start = item.startDate || item.start_date;
          const end = item.endDate || item.end_date;
          return {
            ...item,
            status: computeStatus(start, end),
          };
        });
        if (!isMounted) return;
        setClasses(formatted);
        const cats = Array.from(
          new Set(
            formatted
              .map((c) => c.category)
              .filter((cat) => cat && cat !== "All" && cat !== "Trending")
          )
        );
        setCategories(["All", "Trending", ...cats]);
      } catch (err) {
        console.error("Failed to load classes", err);
        if (isMounted) {
          setError(classesLoadFailed);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [retryKey, classesLoadFailed]);

  useEffect(() => {
    if (!user || !isStudent) {
      setWishlistIds([]);
      setLikedIds([]);
      return;
    }
    let isMounted = true;
    const load = async () => {
      try {
        const wishlist = await getMyClassWishlist();
        const liked = await getMyLikedClasses();
        if (!isMounted) return;
        setWishlistIds(wishlist.map((c) => c.id));
        setLikedIds(liked.map((c) => c.id));
      } catch (err) {
        console.error("Failed to load wishlist/likes", err);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [user, isStudent]);

  useEffect(() => {
    setVisibleCount(6);
  }, [selectedCategory, showLiveClasses, searchQuery]);

  const updateActionLoading = (key, isActive) => {
    setActionLoading((prev) => {
      if (isActive) {
        return { ...prev, [key]: true };
      }
      const { [key]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const filteredClasses = useMemo(() => {
    const lowerQuery = searchQuery.trim().toLowerCase();
    const filtered = classes.filter((classItem) => {
      const matchesCategory =
        selectedCategory === "All" ||
        (selectedCategory === "Trending" && classItem.trending) ||
        classItem.category === selectedCategory;
      const matchesStatus = showLiveClasses ? classItem.status === "Live" : true;
      const matchesSearch = classItem.title
        ?.toLowerCase()
        .includes(lowerQuery);
      return matchesCategory && matchesStatus && matchesSearch;
    });
    return filtered
      .slice()
      .sort((a, b) => {
        const statusDiff =
          (statusRank[a.status] ?? Number.MAX_SAFE_INTEGER) -
          (statusRank[b.status] ?? Number.MAX_SAFE_INTEGER);
        if (statusDiff !== 0) return statusDiff;
        if (a.trending !== b.trending) {
          return Number(b.trending) - Number(a.trending);
        }
        const aStart =
          new Date(a.startDate || a.start_date || 0).getTime() || Number.MAX_SAFE_INTEGER;
        const bStart =
          new Date(b.startDate || b.start_date || 0).getTime() || Number.MAX_SAFE_INTEGER;
        if (aStart !== bStart) return aStart - bStart;
        return (b.id || 0) - (a.id || 0);
      });
  }, [classes, selectedCategory, showLiveClasses, searchQuery]);

  const displayedClasses = useMemo(
    () => filteredClasses.slice(0, visibleCount),
    [filteredClasses, visibleCount]
  );

  const filtersActive =
    selectedCategory !== "All" ||
    showLiveClasses ||
    searchQuery.trim().length > 0;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 6);
  };

  const handleRetry = () => {
    setRetryKey((prev) => prev + 1);
  };

  const handleResetFilters = () => {
    setSelectedCategory("All");
    setShowLiveClasses(false);
    setSearchQuery("");
  };

  const handleLikeToggle = async (classItem) => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (!isStudent) {
      toast.error(studentsOnlyLike);
      return;
    }
    const key = `like-${classItem.id}`;
    updateActionLoading(key, true);
    try {
      if (likedIds.includes(classItem.id)) {
        await unlikeClass(classItem.id);
        setLikedIds((prev) => prev.filter((i) => i !== classItem.id));
      } else {
        await likeClass(classItem.id);
        setLikedIds((prev) => [...prev, classItem.id]);
      }
    } catch (err) {
      console.error("Failed to toggle class like", err);
      toast.error(toggleLikeError);
    } finally {
      updateActionLoading(key, false);
    }
  };

  const handleWishlistToggle = async (classItem) => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (!isStudent) {
      toast.error(studentsOnlySave);
      return;
    }
    const key = `wishlist-${classItem.id}`;
    updateActionLoading(key, true);
    try {
      if (wishlistIds.includes(classItem.id)) {
        await removeClassFromWishlist(classItem.id);
        setWishlistIds((prev) => prev.filter((i) => i !== classItem.id));
      } else {
        await addClassToWishlist(classItem.id);
        setWishlistIds((prev) => [...prev, classItem.id]);
      }
    } catch (err) {
      console.error("Failed to toggle class wishlist", err);
      toast.error(toggleWishlistError);
    } finally {
      updateActionLoading(key, false);
    }
  };

  const renderPrice = (classItem) => {
    if (classItem.access_type === "free") return t("plan_members_only");
    const priceValue = Number(classItem.price);
    if (!priceValue) return freeLabel;
    const currencyCode = classItem.currency || classItem.currency_code;
    return formatCurrency(priceValue, currencyCode ? { currency: currencyCode } : undefined);
  };

  const skeletonCards = useMemo(
    () => Array.from({ length: 6 }, (_, idx) => idx),
    []
  );

  return (
    <div id="online-classes" className="bg-gray-900 min-h-screen text-white">
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative w-full py-20 text-center bg-gradient-to-b from-gray-800 to-gray-900"
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2 className="text-5xl font-extrabold mb-6 text-yellow-500">
            🚀 {t("online_classes_heading")}
          </motion.h2>
          <motion.p className="text-lg text-gray-300 mb-8">
            {t("online_classes_description")}
          </motion.p>

          <div className="flex flex-wrap justify-center items-center gap-4 mb-8">
            <div className="relative w-full max-w-lg">
              <input
                type="text"
                placeholder={t("search_classes_placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:outline-none text-gray-900 shadow-lg"
              />
              <FaSearch className="absolute left-3 top-4 text-gray-600 text-xl" />
            </div>

            <select
              className="p-3 border border-gray-300 rounded-lg bg-gray-800 text-white shadow-lg"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowLiveClasses((prev) => !prev)}
              className={`p-3 rounded-lg shadow-lg transition ${
                showLiveClasses
                  ? "bg-yellow-500 text-gray-900"
                  : "bg-gray-800 text-white"
              }`}
            >
              {showLiveClasses
                ? `📹 ${t("show_all_classes")}`
                : `🎥 ${t("show_only_live")}`}
            </button>
          </div>

          {error ? (
            <div className="max-w-xl mx-auto bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-lg">
              <p className="text-lg text-red-300 mb-6">{error}</p>
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-yellow-500 text-gray-900 font-semibold rounded-lg hover:bg-yellow-600 transition"
              >
                {retryLabel}
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading
                  ? skeletonCards.map((idx) => (
                      <div
                        key={`skeleton-${idx}`}
                        className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden animate-pulse"
                      >
                        <div className="h-48 bg-gray-700" />
                        <div className="p-6 space-y-4">
                          <div className="h-4 bg-gray-700 rounded w-3/4" />
                          <div className="h-3 bg-gray-700 rounded w-1/2" />
                          <div className="h-3 bg-gray-700 rounded w-2/3" />
                          <div className="h-10 bg-gray-700 rounded w-full" />
                        </div>
                      </div>
                    ))
                  : displayedClasses.map((classItem) => {
                      const likeKey = `like-${classItem.id}`;
                      const wishlistKey = `wishlist-${classItem.id}`;
                      const startDate = classItem.startDate || classItem.start_date;
                      const formattedDate = startDate
                        ? new Date(startDate).toLocaleDateString()
                        : "";
                      const classStatus = classItem.status;
                      const isLive = classStatus === "Live";
                      const hasPlanCoverage =
                        Array.isArray(classItem.included_plans) &&
                        classItem.included_plans.length > 0;
                      const requiresPlanOnly = classItem.access_type === "free";

                      return (
                        <motion.div
                          key={classItem.id}
                          whileHover={{ scale: 1.02 }}
                          className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col"
                        >
                          <div className="relative h-52 w-full">
                            {classItem.cover_image ? (
                              <Image
                                src={classItem.cover_image}
                                alt={classItem.title || "Online class cover"}
                                fill
                                sizes="(min-width: 1024px) 33vw, 100vw"
                                className="object-cover"
                                priority={false}
                              />
                            ) : (
                              <div className="h-full w-full bg-gray-700 flex items-center justify-center">
                                <FaBookOpen className="text-yellow-400 text-4xl" />
                              </div>
                            )}
                            <div className="absolute top-3 left-3 flex flex-col gap-2">
                              {classItem.trending && (
                                <span className="bg-yellow-500 text-gray-900 px-3 py-1 text-xs font-bold rounded-full shadow-sm">
                                  🔥 {t("trending_badge")}
                                </span>
                              )}
                              <span
                                className={`px-3 py-1 text-xs font-bold rounded-full ${
                                  isLive
                                    ? "bg-red-500 text-white animate-pulse"
                                    : classStatus === "Completed"
                                    ? "bg-gray-600 text-white"
                                    : "bg-green-600 text-white"
                                }`}
                              >
                                {classStatus}
                              </span>
                              {hasPlanCoverage && (
                                <span className="bg-blue-500 text-white px-3 py-1 text-xs font-bold rounded-full shadow-sm">
                                  {requiresPlanOnly
                                    ? t("plan_required_badge")
                                    : t("plan_included_badge")}
                                </span>
                              )}
                            </div>
                            <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                              <button
                                onClick={() => handleLikeToggle(classItem)}
                                disabled={!!actionLoading[likeKey]}
                                className={`p-2 rounded-full bg-gray-900 bg-opacity-70 hover:bg-opacity-100 transition ${
                                  likedIds.includes(classItem.id)
                                    ? "text-yellow-400"
                                    : "text-gray-200"
                                } ${actionLoading[likeKey] ? "opacity-60 cursor-not-allowed" : ""}`}
                                aria-label={likedIds.includes(classItem.id) ? t("unlike_class") : t("like_class")}
                              >
                                <FaThumbsUp />
                              </button>
                              <button
                                onClick={() => handleWishlistToggle(classItem)}
                                disabled={!!actionLoading[wishlistKey]}
                                className={`p-2 rounded-full bg-gray-900 bg-opacity-70 hover:bg-opacity-100 transition ${
                                  wishlistIds.includes(classItem.id)
                                    ? "text-yellow-400"
                                    : "text-gray-200"
                                } ${
                                  actionLoading[wishlistKey]
                                    ? "opacity-60 cursor-not-allowed"
                                    : ""
                                }`}
                                aria-label={
                                  wishlistIds.includes(classItem.id)
                                    ? t("remove_from_wishlist")
                                    : t("add_to_wishlist")
                                }
                              >
                                <FaHeart />
                              </button>
                            </div>
                          </div>
                          <div className="flex-1 flex flex-col text-left p-6 space-y-4">
                            <div>
                              <h3 className="text-xl font-bold text-white line-clamp-2">
                                {classItem.title}
                              </h3>
                              {classItem.instructor && (
                                <p className="text-sm text-gray-300 mt-1">
                                  👨‍🏫 {classItem.instructor}
                                </p>
                              )}
                              {classItem.category && (
                                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">
                                  {classItem.category}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                              {formattedDate && (
                                <span className="flex items-center gap-2">
                                  <FaCalendarAlt className="text-yellow-400" />
                                  {formattedDate}
                                </span>
                              )}
                              {Number(classItem.recent_enrollments) > 0 && (
                                <span className="flex items-center gap-2">
                                  <FaUsers className="text-yellow-400" />
                                  {t("recent_learners", {
                                    count: Number(classItem.recent_enrollments),
                                  })}
                                </span>
                              )}
                            </div>
                            <div className="mt-auto pt-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-semibold text-yellow-400">
                                  {renderPrice(classItem)}
                                </span>
                              </div>
                              {hasPlanCoverage && (
                                <p className="text-xs text-yellow-200 text-left">
                                  {requiresPlanOnly
                                    ? t("plan_required_hint")
                                    : t("plan_optional_hint")}
                                </p>
                              )}
                              <button
                                className="bg-yellow-500 text-gray-900 font-semibold px-5 py-2 rounded-lg hover:bg-yellow-600 transition w-full"
                                onClick={() => router.push(`/online-classes/${classItem.id}`)}
                              >
                                {isLive
                                  ? `🎥 ${t("join_live")}`
                                  : `📘 ${t("view_class")}`}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
              </div>

              {!loading && !displayedClasses.length && (
                <div className="mt-12 bg-gray-800 border border-gray-700 rounded-2xl p-10 max-w-3xl mx-auto text-center space-y-4">
                  <p className="text-lg text-gray-200">{noResultsLabel}</p>
                  {filtersActive && (
                    <button
                      onClick={handleResetFilters}
                      className="px-5 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                    >
                      {resetFiltersLabel}
                    </button>
                  )}
                </div>
              )}

              {!loading && visibleCount < filteredClasses.length && (
                <motion.button
                  onClick={handleLoadMore}
                  whileHover={{ scale: 1.05 }}
                  className="mt-10 px-6 py-3 bg-yellow-500 text-gray-900 text-lg font-bold rounded-lg shadow-lg hover:bg-yellow-600 transition"
                >
                  {t("load_more_classes")}
                </motion.button>
              )}
            </>
          )}

          {!loading && !error && filteredClasses.length > 0 && (
            <p className="mt-6 text-sm text-gray-400">
              {t("showing_classes", {
                current: Math.min(visibleCount, filteredClasses.length),
                total: filteredClasses.length,
              })}
            </p>
          )}
        </div>
      </motion.section>
    </div>
  );
};

export default OnlineClasses;
