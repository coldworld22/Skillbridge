import React, { useState, useEffect } from "react";
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

export const getStars = (rating) => {
  const safeRating = Number.isFinite(rating)
    ? Math.min(Math.max(rating, 0), 5)
    : 0;
  if (safeRating <= 0) return null;
  const full = Math.floor(safeRating);
  const half = safeRating % 1 >= 0.5;
  return (
    <div className="flex items-center">
      {Array.from({ length: full }).map((_, i) => (
        <FaStar key={i} className="text-yellow-400 text-sm" />
      ))}
      {half && <FaStar className="text-yellow-300 opacity-50 text-sm" />}
      {Array.from({ length: 5 - full - (half ? 1 : 0) }).map((_, i) => (
        <FaStar key={`empty-${i}`} className="text-gray-500 text-sm" />
      ))}
    </div>
  );
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
          });
        }
      } catch (err) {
        console.error('Failed to sync progress', err);
      }
    };
    window.addEventListener('tutorial-progress', handler);
    return () => window.removeEventListener('tutorial-progress', handler);
  }, [user, enrolledIds]);

  const filteredTutorials =
    activeTab === "All"
      ? tutorials
      : tutorials.filter((t) => {
          const id = t.categoryId ?? t.category_id;
          return id === activeTab;
        });

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
                activeTab === tab.value
                  ? "bg-yellow-500 text-black border-yellow-400 font-semibold"
                  : "bg-gray-800 text-yellow-300 border-gray-600 hover:bg-gray-700"
              }`}
              onClick={() => setActiveTab(tab.value)}
              aria-label={`Show ${tab.label} tutorials`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tutorial Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutorials.map((tut, index) => {
            const isTopRated = Array.isArray(tut.tags) && tut.tags.includes("Top Rated");
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

                <div className="p-4">
                  <h3 className="font-bold text-yellow-400 text-lg mb-1 line-clamp-2 min-h-[56px]">
                    {tut.title}
                  </h3>
                  <p className="text-sm text-gray-300 mb-2">
                    Instructor: {tut.instructor}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-2 text-xs">
                    <span className="bg-yellow-500 text-black px-2 py-1 rounded-full font-semibold">
                      {tut.level}
                    </span>
                    {Array.isArray(tut.tags) &&
                      tut.tags.slice(0, 2).map((tag, i) => (
                        <span
                          key={i}
                          className="bg-gray-700 px-2 py-1 rounded-full text-yellow-300"
                          title={`Tag: ${tag}`}
                        >
                          #{tag}
                        </span>
                      ))}
                    {Array.isArray(tut.tags) && tut.tags.length > 2 && (
                      <span className="bg-gray-700 px-2 py-1 rounded-full text-yellow-300">
                        +{tut.tags.length - 2}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-4 text-sm">
                    {tut.rating > 0 && (
                      <div className="flex items-center gap-1 text-yellow-400">
                        {getStars(tut.rating)}
                        {tut.ratingCount > 0 && (
                          <span className="text-gray-400 ml-1">({tut.ratingCount})</span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-gray-400">
                      <FaClock size={12} /> {tut.duration}
                    </div>
                  </div>

                  <div className="mt-3 flex justify-between items-center">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        Number(tut.discountPrice ?? tut.price) > 0
                          ? 'bg-yellow-500 text-black'
                          : 'bg-green-500 text-black'
                      }`}
                    >
                      {Number(tut.discountPrice ?? tut.price) > 0 ? (
                        tut.discountPrice && Number(tut.discountPrice) < Number(tut.price) ? (
                          <>
                            <span className="line-through mr-1">
                              {formatCurrency(tut.price, { currency: tut.currency })}
                            </span>
                            <span>
                              {formatCurrency(tut.discountPrice, { currency: tut.currency })}
                            </span>
                          </>
                        ) : (
                          formatCurrency(tut.price, { currency: tut.currency })
                        )
                      ) : (
                        t('free')
                      )}
                    </span>
                    
                    {enrolledIds.includes(tut.id) && (
                      <span className="text-xs text-green-400 font-medium">
                        {t('enrolled')}
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {enrolledIds.includes(tut.id) && (
                    <div className="mt-3">
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

                  <div className="flex gap-2 mt-4">
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
                          const price = tut.discountPrice ?? tut.price;
                          if (price == null) {
                            console.error(
                              `Cannot add tutorial ${tut.id} to cart: missing price`,
                            );
                            return;
                          }
                          const added = await addItem({
                            id: tut.id,
                            name: tut.title,
                            item_type: 'tutorial',
                            price: (tut.discountPrice ?? tut.price) || 0,
                            quantity: 1,
                            ...(tut.currency || tut.currencyCode
                              ? { currency: tut.currency || tut.currencyCode }
                              : {}),
                          });
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
          })}
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