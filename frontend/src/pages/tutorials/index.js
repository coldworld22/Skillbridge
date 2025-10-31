import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import Image from "next/image";
import { FaStar, FaFire, FaEye, FaArrowUp, FaSearch, FaFilter, FaBookmark, FaHeart } from "react-icons/fa";
import { useTranslation } from "next-i18next";
import { toast } from "react-toastify";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import FilterSidebar from "@/components/tutorials/FilterSidebar";
import {
  fetchPublishedTutorials,
  fetchTutorialProgress,
  getMyTutorialWishlist,
  getMyTutorialFavorites,
  addTutorialToWishlist,
  removeTutorialFromWishlist,
  addTutorialToFavorites,
  removeTutorialFromFavorites,
  enrollInTutorial,
} from "@/services/tutorialService";
import { formatCurrency } from "@/utils/currency";
import useCartStore from "@/store/cart/cartStore";
import useAuthStore from "@/store/auth/authStore";
import { fetchAds as fetchAdBanners } from "@/services/adsService";

/**
 * Retrieves enrollment status and progress percentage for a tutorial.
 * Prefers backend API data and falls back to `localStorage` if unavailable.
 * @param {Object} tut - Tutorial information containing an `id` and optional
 * chapter metadata.
 * @returns {Promise<{enrolled: boolean, status: string | null, progress: number}>}
 */
export const loadTutorialStatus = async (tut) => {
  const authState = useAuthStore.getState();
  const userId = authState.user?.id;
  const userRoles = Array.isArray(authState.user?.roles)
    ? authState.user.roles
    : [authState.user?.role].filter(Boolean);
  const isStudent = userRoles.some(
    (role) => typeof role === "string" && role.toLowerCase() === "student",
  );
  let enrolled = false;
  let progressPercent = 0;
  let status = null;

  if (isStudent) {
    try {
      const apiData = await fetchTutorialProgress(tut.id);
      if (apiData) {
        enrolled = !!apiData.enrolled;
        status = apiData.status ?? null;
        if (apiData.progress != null) {
          progressPercent = Number(apiData.progress);
        }
        return { enrolled, status, progress: progressPercent };
      }
    } catch (err) {
      // Ignore API errors and fall back to localStorage
    }
  }

  if (typeof window !== "undefined") {
    const prefix = userId ? `${userId}-` : "";
    enrolled = !!localStorage.getItem(`enrolled-${prefix}${tut.id}`);
    const saved = localStorage.getItem(
      `progress-tutorial-${prefix}${tut.id}`
    );
    if (saved) {
      try {
        const data = JSON.parse(saved);
        const total = Array.isArray(tut.chapters)
          ? tut.chapters.length
          : tut.totalLessons || tut.total_chapters || tut.chapter_count || 0;
        if (total) {
          progressPercent =
            ((data.completedChapters?.length || 0) / total) * 100;
        }
      } catch {}
    }
  }

  return { enrolled, status, progress: progressPercent };
};

const TutorialsSection = () => {
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("default");
  const [visibleCount, setVisibleCount] = useState(6);
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [filters, setFilters] = useState({
    categories: [],
    levels: [],
    price: null,
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [statusMap, setStatusMap] = useState({});
  const [wishlistIds, setWishlistIds] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const user = useAuthStore((state) => state.user);
  const userRoles = Array.isArray(user?.roles)
    ? user.roles
    : [user?.role].filter(Boolean);
  const isStudent = userRoles.some(
    (role) => typeof role === "string" && role.toLowerCase() === "student",
  );
  const router = useRouter();
  const loader = useRef(null);
  const { t } = useTranslation("tutorials", { keyPrefix: "list" });
  const addItem = useCartStore((state) => state.addItem);
  const [ads, setAds] = useState([]);

  const fetchUserLists = useCallback(async () => {
    if (!user || !isStudent) return;
    try {
      const [wishlist, favorites] = await Promise.all([
        getMyTutorialWishlist(),
        getMyTutorialFavorites(),
      ]);
      setWishlistIds(wishlist.map((t) => t.id));
      setFavoriteIds(favorites.map((t) => t.id));
    } catch (err) {
      console.error("Failed to load user lists", err);
    }
  }, [user, isStudent]);

  const toggleFavorite = async (id) => {
    if (!user) return router.push('/auth/login');
    if (!isStudent) {
      toast.error('Only students can save tutorials.');
      return;
    }
    try {
      if (favoriteIds.includes(id)) {
        await removeTutorialFromFavorites(id);
        setFavoriteIds((prev) => prev.filter((i) => i !== id));
        toast.success(t('removed_from_favorites', 'Removed from favorites'));
      } else {
        await addTutorialToFavorites(id);
        setFavoriteIds((prev) => [...prev, id]);
        toast.success(t('added_to_favorites', 'Added to favorites'));
      }
      await fetchUserLists();
    } catch (err) {
      toast.error('Failed to update favorites');
    }
  };

  const toggleWishlist = async (id) => {
    if (!user) return router.push('/auth/login');
    if (!isStudent) {
      toast.error('Only students can save tutorials.');
      return;
    }
    try {
      if (wishlistIds.includes(id)) {
        await removeTutorialFromWishlist(id);
        setWishlistIds((prev) => prev.filter((i) => i !== id));
        toast.success(t('removed_from_wishlist', 'Removed from wishlist'));
      } else {
        await addTutorialToWishlist(id);
        setWishlistIds((prev) => [...prev, id]);
        toast.success(t('added_to_wishlist'));
      }
      await fetchUserLists();
    } catch (err) {
      toast.error('Failed to update wishlist');
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetchAdBanners({ limit: 10 }).then((res) => setAds(res.data)).catch(() => {});
  }, []);

  const handleFilterChange = (f) => {
    setFilters((prev) => ({ ...prev, ...f }));
    setVisibleCount(6);
  };

  const resetFilters = () => {
    setFilters((prev) => ({ ...prev, categories: [], levels: [], price: null }));
  };

  useEffect(() => {
    const controller = new AbortController();
    const loadTutorials = async () => {
      try {
        const data = await fetchPublishedTutorials({ signal: controller.signal });
        setTutorials(data?.data || data || []);
      } catch (err) {
        if (err.name === 'AbortError' || err.name === 'CanceledError') return;
        console.error(err);
        setError(t("load_error"));
      } finally {
        setLoading(false);
      }
    };
    loadTutorials();
    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!tutorials.length) return;
    const loadStatuses = async () => {
      const entries = await Promise.all(
        tutorials.map(async (t) => [t.id, await loadTutorialStatus(t)])
      );
      setStatusMap(Object.fromEntries(entries));
    };
    loadStatuses();
  }, [tutorials]);

  useEffect(() => {
    fetchUserLists();
  }, [fetchUserLists]);

  const filteredTutorials = tutorials.filter((tut) => {
    const matchCategory =
      !filters.categories.length ||
      filters.categories.includes(tut.category_name) ||
      (tut.tags || []).some((tag) => filters.categories.includes(tag));

    const matchLevel =
      !filters.levels.length || filters.levels.includes(tut.level);

    const matchPrice =
      filters.price == null ||
      filters.price === Infinity ||
      tut.price == null ||
      Number(tut.price) <= Number(filters.price);

    const matchSearch =
      tut.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tut.instructor || "").toLowerCase().includes(searchQuery.toLowerCase());

    return matchCategory && matchLevel && matchPrice && matchSearch;
  });

  const sortedTutorials = [...filteredTutorials].sort((a, b) => {
    if (sortBy === "views") return b.views - a.views;
    if (sortBy === "rating") return b.rating - a.rating;
    return 0;
  });

  const visibleTutorials = sortedTutorials.slice(0, visibleCount);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 3, sortedTutorials.length));
        }
      },
      { threshold: 1 }
    );

    if (loader.current) observer.observe(loader.current);

    return () => {
      if (loader.current) observer.unobserve(loader.current);
    };
  }, [loader, sortedTutorials.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-yellow-400">
        ⏳ {t("loading")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <section className="min-h-screen relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-10" />
      <Navbar />
      {ads.map((ad) => (
        <div key={ad.id} className="max-w-7xl mx-auto mt-4">
          <a href={ad.link} target="_blank" rel="noopener noreferrer">
            {ad.image && (
              <img
                src={ad.image}
                alt={ad.title}
                className="w-full h-48 object-cover rounded"
              />
            )}
          </a>
        </div>
      ))}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.h2 
            className="text-4xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500"
            whileHover={{ scale: 1.02 }}
          >
            {t("heading")}
          </motion.h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            {t("subheading")}
          </p>
        </motion.div>

        {/* Mobile Filters Button */}
        <div className="lg:hidden mb-6 flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <label htmlFor="tutorial-search-mobile" className="sr-only">
              Search tutorials
            </label>
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              id="tutorial-search-mobile"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("search_placeholder")}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-800/60 backdrop-blur-sm border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <button
            className="ml-3 p-2.5 rounded-lg bg-gray-800/60 backdrop-blur-sm border border-gray-700 hover:bg-gray-700 transition-all"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
          >
            <FaFilter className="text-yellow-400" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filter Sidebar - Enhanced with glass effect */}
          <div
            className={`fixed lg:sticky top-0 left-0 lg:left-auto h-screen lg:h-auto w-full lg:w-1/4 bg-gray-900/80 backdrop-blur-lg lg:backdrop-blur-none lg:bg-transparent p-6 lg:p-0 z-30 transform lg:transform-none transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0`}
          >
            <div className="flex justify-between items-center mb-6 lg:hidden">
              <h3 className="text-xl font-bold text-yellow-400">{t("mobile_filters")}</h3>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => setIsSidebarOpen(false)}
              >
                ✕
              </button>
            </div>
            <FilterSidebar
              onFilterChange={handleFilterChange}
              onResetFilters={resetFilters}
            />
          </div>

          <div className="flex-grow">
            {/* Desktop Search & Sort */}
            <div className="hidden lg:flex items-center justify-between gap-4 mb-8">
              <div className="relative w-full max-w-md">
                <label htmlFor="tutorial-search-desktop" className="sr-only">
                  Search tutorials
                </label>
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  id="tutorial-search-desktop"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("desktop_search_placeholder")}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-800/60 backdrop-blur-sm border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-gray-400">{t("sort_by")}</span>
                <select
                  id="tutorial-sort"
                  onChange={(e) => setSortBy(e.target.value)}
                  className="py-2.5 px-4 rounded-lg bg-gray-800/60 backdrop-blur-sm border border-gray-700 text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="default">{t("featured")}</option>
                  <option value="views">{t("most_viewed")}</option>
                  <option value="rating">{t("top_rated")}</option>
                </select>
              </div>
            </div>

            {/* Results Info */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-400">
                {t("showing")} <span className="text-yellow-400 font-medium">{visibleTutorials.length}</span> {t("of")} <span className="text-yellow-400 font-medium">{sortedTutorials.length}</span> {t("tutorials")}
              </p>
              {filters.categories.length > 0 || filters.levels.length > 0 ? (
                <button
                  onClick={resetFilters}
                  className="text-sm text-yellow-400 hover:text-yellow-300 flex items-center"
                >
                  {t("clear_filters")}
                </button>
              ) : null}
            </div>

            {/* Tutorial Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleTutorials.map((tut) => {
                const {
                  enrolled,
                  status: enrollStatus,
                  progress: progressPercent = 0,
                } = statusMap[tut.id] || {};
                const ratingValue = Number.isFinite(Number(tut.rating))
                  ? Number(tut.rating)
                  : 0;
                const starIcons = Array.from({ length: 5 }, (_, index) => {
                  const active =
                    ratingValue >= index + 1 ||
                    (index === 0 && ratingValue > 0 && ratingValue < 1);
                  return (
                    <FaStar
                      key={index}
                      className={active ? "text-yellow-400" : "text-gray-700"}
                      aria-hidden="true"
                    />
                  );
                });
                const priceIsPaid = Number(tut.price) > 0;
                const priceLabel = priceIsPaid
                  ? formatCurrency(tut.price, {
                      currency: tut.currency || tut.currencyCode,
                    })
                  : t("free");
                const instructorName =
                  tut.instructor ||
                  tut.instructor_name ||
                  t("instructor_unknown", "Unknown instructor");
                const levelLabel =
                  tut.level ||
                  tut.difficulty ||
                  t("level_unknown", "Level not set");

                return (
                  <motion.div
                    key={tut.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5 }}
                    className="group relative bg-gradient-to-br from-gray-800/60 to-gray-900/80 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700 shadow-2xl cursor-pointer"
                    onClick={() => router.push(`/tutorials/${tut.id}`)}
                  >
                    {/* Premium Badge */}
                    {Number(tut.price) > 0 && (
                      <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                        {t("premium_badge")}
                      </div>
                    )}

                    {/* Thumbnail */}
                    <div className="relative h-44 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent z-10" />
                      <div className="absolute top-2 right-2 z-20 flex flex-col gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(tut.id);
                          }}
                          aria-label={favoriteIds.includes(tut.id) ? 'Remove from favorites' : 'Add to favorites'}
                          className="bg-gray-700 rounded-full p-1 w-6 h-6 flex items-center justify-center hover:text-red-400"
                        >
                          <FaHeart className={favoriteIds.includes(tut.id) ? 'text-red-500' : 'text-white'} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(tut.id);
                          }}
                          aria-label={wishlistIds.includes(tut.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                          className="bg-gray-700 rounded-full p-1 w-6 h-6 flex items-center justify-center hover:text-yellow-400"
                        >
                          <FaBookmark className={wishlistIds.includes(tut.id) ? 'text-yellow-400' : 'text-white'} />
                        </button>
                      </div>
                      {tut.preview ? (
                        <video
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          src={tut.preview}
                          autoPlay
                          muted
                          loop
                        />
                      ) : (
                        <Image
                          src={tut.thumbnail || "/images/logo.png"}
                          alt={tut.title}
                          width={640}
                          height={256}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      )}

                      {/* Progress bar */}
                      {enrolled ? (
                        <div className="absolute bottom-0 left-0 right-0 z-20 h-1.5 bg-gray-700">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-500 to-amber-500"
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                      ) : (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!user) return router.push('/auth/login');
                            if (!isStudent) {
                              return;
                            }
                            try {
                              await enrollInTutorial(tut.id);
                              const status = await loadTutorialStatus(tut);
                              setStatusMap((prev) => ({ ...prev, [tut.id]: status }));
                            } catch {}
                          }}
                          className="absolute bottom-3 left-3 z-20 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded"
                        >
                          Enroll
                        </button>
                      )}
                    </div>

                    <div className="p-5 space-y-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold text-lg text-white group-hover:text-yellow-400 transition-colors line-clamp-2">
                          {tut.title}
                        </h3>
                        {tut.trending && (
                          <span className="flex-shrink-0 bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-1 text-xs rounded-full ml-2">
                            <FaFire className="inline mr-1" /> {t("trending")}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-11 w-11 rounded-full overflow-hidden border border-gray-700 bg-gray-800 flex-shrink-0">
                            <Image
                              src={
                                tut.instructorAvatar ||
                                "/images/default-avatar.png"
                              }
                              alt={instructorName}
                              width={44}
                              height={44}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs uppercase tracking-wide text-gray-500">
                              {t("card.instructor_label", "Instructor")}
                            </p>
                            <p className="text-sm font-medium text-white truncate">
                              {instructorName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            {t("card.level_label", "Level")}
                          </p>
                          <p className="text-sm font-semibold text-yellow-300">
                            {levelLabel}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-300">
                        <div className="flex items-center gap-1 flex-wrap">
                          {starIcons}
                          <span className="ml-2 text-yellow-400 font-semibold">
                            {ratingValue.toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({tut.ratingCount ?? 0})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center text-xs text-gray-400">
                            <FaEye className="text-gray-500 mr-1" />
                            {tut.views ?? 0}
                          </span>
                          <span
                            className={`text-base font-semibold ${
                              priceIsPaid ? "text-yellow-400" : "text-green-400"
                            }`}
                          >
                            {priceLabel}
                          </span>
                        </div>
                      </div>

                      {tut.tags?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {tut.tags.slice(0, 2).map((tag, i) => (
                            <span
                              key={i}
                              className="bg-gray-800/70 text-gray-300 text-xs px-2.5 py-1 rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className="flex items-center justify-between border-t border-gray-700/60 pt-4">
                        {enrollStatus ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-800 text-gray-200 text-xs uppercase tracking-wide">
                            {enrollStatus}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 uppercase tracking-wide">
                            {t("card.not_enrolled", "Not enrolled")}
                          </span>
                        )}
                        <button
                          className="px-3 py-1.5 text-xs rounded bg-yellow-500 text-black font-semibold hover:bg-yellow-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            const price = tut.discountPrice ?? tut.price;
                            if (price == null) {
                              console.error(
                                `Cannot add tutorial ${tut.id} to cart: missing price`,
                              );
                              return;
                            }
                            addItem({
                              id: tut.id,
                              name: tut.title,
                              item_type: "tutorial",
                              price,
                              ...(tut.currency || tut.currencyCode
                                ? { currency: tut.currency || tut.currencyCode }
                                : {}),
                            });
                          }}
                        >
                          {t("add_to_cart", "Add to Cart")}
                        </button>
                      </div>
                    </div>

                    {/* Enrolled Badge */}
                    {enrolled && (
                      <div className="absolute top-3 left-3 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                        {t("enrolled")}
                      </div>
                    )}
                  </motion.div>
                );
              })}
              
              {/* Empty State */}
              {visibleTutorials.length === 0 && (
                <div className="col-span-full py-16 text-center">
                  <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-8 max-w-md mx-auto border border-gray-700">
                    <div className="text-5xl mb-4">🔍</div>
                    <h3 className="text-xl font-bold text-white mb-2">{t("empty_title")}</h3>
                    <p className="text-gray-400 mb-4">
                      {t("empty_description")}
                    </p>
                    <button
                      onClick={resetFilters}
                      className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-lg text-black font-medium hover:opacity-90 transition-opacity"
                    >
                      {t("reset_filters")}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Load More */}
            {visibleCount < sortedTutorials.length && (
              <div ref={loader} className="text-center mt-10">
                <div className="inline-flex items-center space-x-2 text-gray-400 animate-pulse">
                  <div className="w-4 h-4 rounded-full bg-yellow-500 animate-bounce"></div>
                  <div className="w-4 h-4 rounded-full bg-yellow-500 animate-bounce delay-100"></div>
                  <div className="w-4 h-4 rounded-full bg-yellow-500 animate-bounce delay-200"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll to Top */}
      {showScrollToTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-20 p-3 bg-gradient-to-br from-yellow-500 to-amber-500 text-black rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          <FaArrowUp />
        </motion.button>
      )}

      <Footer />
    </section>
  );
};

export default TutorialsSection;

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'tutorials'], nextI18NextConfig)),
    },
  };
}
