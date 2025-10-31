import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { motion } from "framer-motion";
import { FaStar, FaClock, FaBookmark, FaHeart } from "react-icons/fa";
import { toast } from "react-toastify";
import useCartStore from "@/store/cart/cartStore";
import useAuthStore from "@/store/auth/authStore";
import { fetchAllCategories } from "@/services/instructor/categoryService";
import { formatCurrency } from "@/utils/currency";
import {
  fetchFeaturedTutorials,
  addTutorialToWishlist,
  removeTutorialFromWishlist,
  getMyTutorialWishlist,
  addTutorialToFavorites,
  removeTutorialFromFavorites,
  getMyTutorialFavorites,
  getMyEnrolledTutorials,
  saveTutorialProgress,
} from "@/services/tutorialService";

const PROGRESS_KEY_BASE = "skillbridge_tutorialProgress";
const getProgressKey = (uid) => `${PROGRESS_KEY_BASE}_${uid}`;

const renderStars = (rating) => {
  const safeRating = Number.isFinite(rating)
    ? Math.min(Math.max(rating, 0), 5)
    : 0;
  return Array.from({ length: 5 }, (_, index) => {
    const starNumber = index + 1;
    const isActive =
      safeRating >= starNumber ||
      (index === 0 && safeRating > 0 && safeRating < 1);
    return (
      <FaStar
        key={index}
        className={`text-sm ${isActive ? "text-yellow-400" : "text-gray-600"}`}
        aria-hidden="true"
      />
    );
  });
};

const resolveDurationLabel = (tutorial) => {
  const stringFields = [
    tutorial.durationLabel,
    tutorial.duration_label,
    tutorial.durationText,
    tutorial.duration_text,
  ];
  for (const value of stringFields) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  const numericCandidates = [tutorial.duration, tutorial.duration_minutes];
  for (const candidate of numericCandidates) {
    const numeric = Number(candidate);
    if (Number.isFinite(numeric) && numeric > 0) {
      if (numeric >= 60) {
        const hours = Math.floor(numeric / 60);
        const minutes = Math.round(numeric % 60);
        const hourLabel = hours ? `${hours}h` : "";
        const minuteLabel = minutes ? `${minutes}m` : "";
        return `${hourLabel}${hourLabel && minuteLabel ? " " : ""}${minuteLabel}`.trim();
      }
      return `${numeric}m`;
    }
  }

  const dateFields = [
    tutorial.published_at,
    tutorial.publishedAt,
    tutorial.created_at,
    tutorial.createdAt,
  ];
  for (const value of dateFields) {
    if (!value) continue;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString();
    }
  }

  return null;
};

const LandingTutorialsSection = () => {
  const { t } = useTranslation('website');
  const [activeTab, setActiveTab] = useState("All");
  const [tutorials, setTutorials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [progress, setProgress] = useState({});
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const user = useAuthStore((state) => state.user);
  // Some APIs return a single `role` while others return an array `roles`.
  // Normalize to an array so we can reliably check if the user is a student.
  const userRoles = Array.isArray(user?.roles)
    ? user.roles
    : [user?.role].filter(Boolean);
  const isStudent = userRoles.some((r) => r?.toLowerCase() === 'student');
  const [wishlistIds, setWishlistIds] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showEnrolledOnly, setShowEnrolledOnly] = useState(false);

  const availableLevels = useMemo(() => {
    const set = new Set();
    tutorials.forEach((tutorial) => {
      const level = typeof tutorial.level === "string" ? tutorial.level.trim() : "";
      if (level && level.toLowerCase() !== "all levels") {
        set.add(level);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tutorials]);

  const availableTags = useMemo(() => {
    const set = new Set();
    tutorials.forEach((tutorial) => {
      if (Array.isArray(tutorial.tags)) {
        tutorial.tags.forEach((tag) => {
          if (typeof tag === "string" && tag.trim()) {
            set.add(tag.trim());
          }
        });
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tutorials]);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMobile(/Mobi|Android/i.test(navigator.userAgent));
    }
    let isMounted = true;

    const load = async () => {
      const tutorialsPromise = fetchFeaturedTutorials().catch((err) => ({ error: err }));
      const categoriesPromise = fetchAllCategories({ limit: 100 }).catch((err) => ({ error: err }));

      const [tutorialRes, categoryRes] = await Promise.all([
        tutorialsPromise,
        categoriesPromise,
      ]);

      if (isMounted) {
        if (tutorialRes?.error) {
          const err = tutorialRes.error;
          const msg =
            err.code === "ERR_NETWORK"
              ? t('network_error')
              : t('tutorials_load_error');
          toast.error(msg);
        } else {
          setTutorials(tutorialRes || []);
        }

        if (categoryRes?.error) {
          const err = categoryRes.error;
          const msg =
            err.code === "ERR_NETWORK"
              ? t('network_error')
              : t('categories_load_error');
          toast.error(msg);
          console.error(t('categories_load_error'), err);
        } else {
          setCategories(categoryRes?.data || categoryRes || []);
        }
      }
    };
    load();

    return () => {
      isMounted = false;
    };
  }, [user, isStudent]);

  useEffect(() => {
    if (!user) {
      setProgress({});
      return;
    }
    try {
      const stored = JSON.parse(
        localStorage.getItem(getProgressKey(user.id)) || "{}",
      );
      setProgress(stored);
    } catch {
      setProgress({});
    }
  }, [user]);

  useEffect(() => {
    if (!user || !isStudent) return;
    const loadLists = async () => {
      try {
        const [w, f, e] = await Promise.all([
          getMyTutorialWishlist(),
          getMyTutorialFavorites(),
          getMyEnrolledTutorials(),
        ]);
        setWishlistIds(w.map((t) => t.id));
        setFavoriteIds(f.map((t) => t.id));
        setEnrolledIds(e.map((t) => t.id));
      } catch (err) {
        console.error('Failed to load user lists', err);
      }
    };
    loadLists();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const key = getProgressKey(user.id);
    const handler = async (e) => {
      const { tutorialId, percent } = e.detail || {};
      if (!tutorialId || !enrolledIds.includes(tutorialId)) return;
      setProgress((prev) => {
        const updated = { ...prev, [tutorialId]: percent };
        localStorage.setItem(key, JSON.stringify(updated));
        return updated;
      });
      try {
        const res = await saveTutorialProgress(tutorialId, percent);
        if (res?.progress != null && res.progress !== percent) {
          setProgress((prev) => {
            const updated = { ...prev, [tutorialId]: res.progress };
            localStorage.setItem(key, JSON.stringify(updated));
            return updated;
          })
        }
      } catch (err) {
        console.error('Failed to sync progress', err);
      }
    };
    window.addEventListener('tutorial-progress', handler);
    return () => window.removeEventListener('tutorial-progress', handler);
  }, [user, enrolledIds]);

  const filteredTutorials = useMemo(() => {
    return tutorials.filter((tutorial) => {
      const categoryId = tutorial.categoryId ?? tutorial.category_id;
      const activeCategory = String(activeTab);
      if (
        activeCategory !== "All" &&
        String(categoryId ?? "") !== activeCategory
      ) {
        return false;
      }

      const term = searchTerm.trim().toLowerCase();
      if (term) {
        const haystack = [
          tutorial.title,
          tutorial.description,
          tutorial.short_description,
          tutorial.instructor,
        ]
          .map((value) => (typeof value === "string" ? value.toLowerCase() : ""))
          .join(" ");
        if (!haystack.includes(term)) {
          return false;
        }
      }

      if (levelFilter !== "all") {
        const level =
          typeof tutorial.level === "string" ? tutorial.level.toLowerCase() : "";
        if (level !== levelFilter.toLowerCase()) {
          return false;
        }
      }

      if (priceFilter !== "all") {
        const priceValue = Number(tutorial.discountPrice ?? tutorial.price) || 0;
        if (priceFilter === "free" && priceValue > 0) return false;
        if (priceFilter === "paid" && priceValue <= 0) return false;
      }

      if (tagFilter !== "all") {
        const tags = Array.isArray(tutorial.tags)
          ? tutorial.tags.map((tag) =>
              typeof tag === "string" ? tag.toLowerCase() : String(tag || "").toLowerCase()
            )
          : [];
        if (!tags.includes(tagFilter.toLowerCase())) {
          return false;
        }
      }

      if (showWishlistOnly && !wishlistIds.includes(tutorial.id)) {
        return false;
      }
      if (showFavoritesOnly && !favoriteIds.includes(tutorial.id)) {
        return false;
      }
      if (showEnrolledOnly && !enrolledIds.includes(tutorial.id)) {
        return false;
      }

      return true;
    });
  }, [
    tutorials,
    activeTab,
    searchTerm,
    levelFilter,
    priceFilter,
    tagFilter,
    showWishlistOnly,
    showFavoritesOnly,
    showEnrolledOnly,
    wishlistIds,
    favoriteIds,
    enrolledIds,
  ]);

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
      levelFilter !== "all" ||
      priceFilter !== "all" ||
      tagFilter !== "all" ||
      showWishlistOnly ||
      showFavoritesOnly ||
      showEnrolledOnly
  );

  const resetFilters = () => {
    setSearchTerm("");
    setLevelFilter("all");
    setPriceFilter("all");
    setTagFilter("all");
    setShowWishlistOnly(false);
    setShowFavoritesOnly(false);
    setShowEnrolledOnly(false);
  };

  return (
    <section id="tutorials" className="bg-gray-950 py-16 text-white px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold text-center text-yellow-400 mb-4"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          📚 {t('featured_tutorials_heading')}
        </motion.h2>

        <p className="text-center text-gray-300 mb-10 max-w-3xl mx-auto">
          {t('featured_tutorials_text')}
        </p>

        {/* Category Tabs */}
        <div className="flex justify-center gap-2 sm:gap-4 mb-8 overflow-x-auto pb-2 px-2">
          {[
            { label: "All", value: "All" },
            ...categories.map((c) => ({ label: c.name, value: c.id })),
          ].map((tab) => (
            <button
              key={tab.value}
              className={`flex-shrink-0 px-4 py-2 rounded-full border transition-colors ${
                activeTab === String(tab.value)
                  ? "bg-yellow-500 text-black border-yellow-400 font-semibold"
                  : "bg-gray-800 text-yellow-300 border-gray-600 hover:bg-gray-700"
              }`}
              onClick={() => setActiveTab(String(tab.value))}
              aria-label={`Show ${tab.label} tutorials`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Controls */}
        <div className="mx-auto mb-8 flex w-full max-w-7xl flex-col gap-4 rounded-2xl bg-gray-900/60 p-4 shadow-lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <label htmlFor="tutorials-search" className="sr-only">
                {t("tutorials_filter_search_label", "Search tutorials")}
              </label>
              <input
                id="tutorials-search"
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("tutorials_filter_search_placeholder", "Search by title, instructor or description")}
                className="w-full rounded-lg border border-gray-700 bg-gray-950/80 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400"
              />
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="self-start rounded-lg border border-yellow-400 px-3 py-2 text-sm font-medium text-yellow-300 transition hover:bg-yellow-500/10 sm:self-auto"
              >
                {t("tutorials_filter_reset", "Reset filters")}
              </button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="tutorials-level" className="block text-xs font-medium uppercase tracking-wide text-gray-400">
                {t("tutorials_filter_level_label", "Level")}
              </label>
              <select
                id="tutorials-level"
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950/80 px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400"
              >
                <option value="all">
                  {t("tutorials_filter_level_all", "All levels")}
                </option>
                {availableLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tutorials-price" className="block text-xs font-medium uppercase tracking-wide text-gray-400">
                {t("tutorials_filter_price_label", "Price")}
              </label>
              <select
                id="tutorials-price"
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950/80 px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400"
              >
                <option value="all">{t("tutorials_filter_price_all", "All prices")}</option>
                <option value="free">{t("tutorials_filter_price_free", "Free")}</option>
                <option value="paid">{t("tutorials_filter_price_paid", "Paid")}</option>
              </select>
            </div>
            <div>
              <label htmlFor="tutorials-tag" className="block text-xs font-medium uppercase tracking-wide text-gray-400">
                {t("tutorials_filter_tag_label", "Tag")}
              </label>
              <select
                id="tutorials-tag"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950/80 px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400"
              >
                <option value="all">
                  {t("tutorials_filter_tag_all", "All tags")}
                </option>
                {availableTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2 rounded-lg border border-gray-700 bg-gray-950/60 px-3 py-2 text-sm text-gray-200">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showWishlistOnly}
                  onChange={(e) => setShowWishlistOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-yellow-400 focus:ring-yellow-400"
                />
                {t("tutorials_filter_wishlist_only", "Wishlist only")}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showFavoritesOnly}
                  onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-yellow-400 focus:ring-yellow-400"
                />
                {t("tutorials_filter_favorites_only", "Favorites only")}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showEnrolledOnly}
                  onChange={(e) => setShowEnrolledOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-yellow-400 focus:ring-yellow-400"
                />
                {t("tutorials_filter_enrolled_only", "Enrolled only")}
              </label>
            </div>
          </div>
        </div>

        {/* Tutorial Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutorials.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-gray-800 bg-gray-900/60 p-10 text-center text-gray-400">
              {hasActiveFilters
                ? t("tutorials_no_results_filters", "No tutorials match your filters yet.")
                : t("tutorials_no_results", "No tutorials available right now.")}
            </div>
          ) : (
            filteredTutorials.map((tut, index) => {
            const isTopRated =
              Array.isArray(tut.tags) && tut.tags.includes("Top Rated");
            const ratingValue = Number.isFinite(Number(tut.rating))
              ? Number(tut.rating)
              : 0;
            const ratingCount = Number.isFinite(Number(tut.ratingCount))
              ? Number(tut.ratingCount)
              : 0;
            const priceValue = Number(tut.discountPrice ?? tut.price) || 0;
            const originalPrice = Number(tut.price) || 0;
            const hasDiscount =
              priceValue > 0 &&
              Number.isFinite(originalPrice) &&
              tut.discountPrice &&
              Number(tut.discountPrice) < originalPrice;
            const formattedPrice = priceValue
              ? formatCurrency(priceValue, { currency: tut.currency })
              : t("free");
            const formattedOriginalPrice =
              hasDiscount && originalPrice
                ? formatCurrency(originalPrice, { currency: tut.currency })
                : null;
            const durationLabel = resolveDurationLabel(tut);
            return (
              <motion.div
                key={tut.id}
                whileHover={{ scale: 1.03 }}
                className="bg-gray-800 rounded-lg overflow-hidden shadow-lg cursor-pointer relative group border border-gray-700 hover:border-yellow-400 transition-all"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                onClick={() => router.push(`/tutorials/${tut.id}`)}
              >
                <div className="relative h-48">
                  {!isMobile && tut.preview ? (
                    <video
                      src={tut.preview}
                      autoPlay={!isMobile}
                      muted
                      playsInline
                      loop
                      poster={tut.thumbnail || "/images/logo.png"}
                      title={tut.title}
                      className="w-full h-full object-cover group-hover:brightness-75 transition"
                    />
                  ) : (
                    <Image
                      src={tut.thumbnail || "/images/logo.png"}
                      alt={tut.title}
                      fill
                      className="object-cover group-hover:brightness-75 transition"
                      placeholder="blur"
                      blurDataURL="/images/logo.png"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  )}
                  {(isTopRated || tut.trending) && (
                    <span
                      className={`absolute top-2 left-2 px-2 py-1 text-xs rounded-full shadow text-white font-semibold ${
                        isTopRated ? "bg-red-600" : "bg-orange-600"
                      }`}
                    >
                      {isTopRated ? "🔥 Top Rated" : "🔥 Trending"}
                    </span>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!user) return router.push('/auth/login');
                        if (!isStudent) {
                          toast.error(t('only_students_save_tutorials'));
                          return;
                        }
                        try {
                          if (favoriteIds.includes(tut.id)) {
                            await removeTutorialFromFavorites(tut.id);
                            const updated = await getMyTutorialFavorites();
                            setFavoriteIds(updated.map((t) => t.id));
                            toast.success(t('removed_from_favorites'));
                          } else {
                            await addTutorialToFavorites(tut.id);
                            const updated = await getMyTutorialFavorites();
                            setFavoriteIds(updated.map((t) => t.id));
                            toast.success(t('added_to_favorites'));
                          }
                        } catch (err) {
                          const message = err?.response?.data?.message || t('failed_to_update_favorites');
                          toast.error(message);
                        }
                      }}
                      aria-label={favoriteIds.includes(tut.id) ? 'Remove from favorites' : 'Add to favorites'}
                      className="bg-gray-900/80 hover:bg-gray-800/90 rounded-full p-2 w-8 h-8 flex items-center justify-center transition"
                    >
                      <FaHeart className={favoriteIds.includes(tut.id) ? 'text-red-500' : 'text-white'} size={14} />
                    </button>

                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!user) return router.push('/auth/login');
                        if (!isStudent) {
                          toast.error(t('only_students_save_tutorials'));
                          return;
                        }
                        try {
                          if (wishlistIds.includes(tut.id)) {
                            await removeTutorialFromWishlist(tut.id);
                            const updated = await getMyTutorialWishlist();
                            setWishlistIds(updated.map((t) => t.id));
                            toast.success(t('removed_from_wishlist'));
                          } else {
                            await addTutorialToWishlist(tut.id);
                            setWishlistIds([...wishlistIds, tut.id]);
                            toast.success(t('added_to_wishlist'));
                          }
                        } catch (err) {
                          const message = err?.response?.data?.message || t('failed_to_update_wishlist');
                          toast.error(message);
                        }
                      }}
                      aria-label={wishlistIds.includes(tut.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                      className="bg-gray-900/80 hover:bg-gray-800/90 rounded-full p-2 w-8 h-8 flex items-center justify-center transition"
                    >
                      <FaBookmark className={wishlistIds.includes(tut.id) ? 'text-yellow-400' : 'text-white'} size={14} />
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  <div className="space-y-3">
                    <h3 className="font-bold text-lg text-white group-hover:text-yellow-400 transition-colors line-clamp-2">
                      {tut.title}
                    </h3>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-700 bg-gray-800 flex-shrink-0">
                          <Image
                            src={tut.instructorAvatar || "/images/default-avatar.png"}
                            alt={tut.instructor || 'Instructor'}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            {t('instructor_label', 'Instructor')}
                          </p>
                          <p className="text-sm font-medium text-white truncate">
                            {tut.instructor || t('unknown_instructor', 'Unknown')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          {t('level_label', 'Level')}
                        </p>
                        <p className="text-sm font-semibold text-yellow-300">
                          {tut.level || t('level_unknown', 'All Levels')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-300">
                    <div className="flex items-center gap-1 flex-wrap">
                      {renderStars(ratingValue)}
                      <span className="ml-2 text-yellow-300 font-semibold">
                        {ratingValue > 0 ? ratingValue.toFixed(1) : "0.0"}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({ratingCount})
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <FaClock size={12} /> {durationLabel || t('duration_na', 'N/A')}
                    </div>
                  </div>

                  {Array.isArray(tut.tags) && tut.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-xs">
                      {tut.tags.slice(0, 2).map((tag, i) => (
                        <span
                          key={i}
                          className="bg-gray-800/70 text-gray-300 px-2 py-1 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                      {tut.tags.length > 2 && (
                        <span className="bg-gray-800/70 text-yellow-300 px-2 py-1 rounded-full">
                          +{tut.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className={`text-base font-semibold ${priceValue > 0 ? 'text-yellow-300' : 'text-green-400'}`}>
                        {formattedPrice}
                      </p>
                      {formattedOriginalPrice && (
                        <p className="text-xs text-gray-400 line-through">
                          {formattedOriginalPrice}
                        </p>
                      )}
                    </div>
                    {enrolledIds.includes(tut.id) ? (
                      <span className="text-xs font-semibold uppercase tracking-wide text-yellow-400">
                        {t('enrolled')}
                      </span>
                    ) : (
                      <span className="text-xs uppercase tracking-wide text-gray-500">
                        {t('not_enrolled', 'Not enrolled')}
                      </span>
                    )}
                  </div>

                  {enrolledIds.includes(tut.id) && (
                    <div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 transition-all duration-300"
                          style={{ width: `${progress[tut.id] || 0}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-400 mt-1 flex justify-between">
                        <span>{t('progress')}</span>
                        <span>{progress[tut.id] || 0}%</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      aria-label="View tutorial details"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/tutorials/${tut.id}`);
                      }}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition"
                    >
                      {t('view_details')}
                    </button>
                    <button
                      aria-label="Add tutorial to cart"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!user) return router.push('/auth/login');
                        if (!isStudent) {
                          toast.error(t('only_students_can_purchase'));
                          return;
                        }
                        try {
                          if (priceValue <= 0) {
                            console.error(
                              `Cannot add tutorial ${tut.id} to cart: missing price`,
                            );
                            return;
                          }
                          const added = await addItem({
                            id: tut.id,
                            name: tut.title,
                            item_type: 'tutorial',
                            price: priceValue,
                            quantity: 1,
                            ...(tut.currency || tut.currencyCode
                              ? { currency: tut.currency || tut.currencyCode }
                              : {}),
                          })
                          if (added) {
                            toast.success(t('added_to_cart'));
                          } else {
                            toast.error(t('failed_to_add_to_cart'));
                          }
                        } catch (err) {
                          toast.error(t('failed_to_add_to_cart'));
                        }
                      }}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black py-2 rounded font-medium transition"
                    >
                      {t('add_to_cart')}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
          )}
        </div>

        {/* Explore Button */}
        <div className="text-center mt-10">
          <motion.a
            href="/tutorials"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-full font-semibold transition shadow-lg"
          >
            {t('explore_all_tutorials')}
          </motion.a>
        </div>
      </div>
    </section>
  );
};

export default LandingTutorialsSection;
