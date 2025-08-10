import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { motion } from "framer-motion";
import { FaStar, FaClock, FaBookmark, FaHeart } from "react-icons/fa";
import { toast } from "react-toastify";
import useCartStore from "@/store/cart/cartStore";
import useAuthStore from "@/store/auth/authStore";
import useTutorialListsStore from "@/store/tutorials/tutorialListsStore";
import { fetchAllCategories } from "@/services/admin/categoryService";
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
  const full = Math.floor(safeRating);
  const half = safeRating % 1 >= 0.5;
  return (
    <>
      {Array.from({ length: full }).map((_, i) => (
        <FaStar key={i} className="text-yellow-400" />
      ))}
      {half && <FaStar className="text-yellow-300 opacity-50" />}
    </>
  );
};

const LandingTutorialsSection = () => {
  const { t } = useTranslation('website');
  const [activeTab, setActiveTab] = useState("All");
  const [tutorials, setTutorials] = useState([]);
  const [categories, setCategories] = useState([]);
  const { status: progress, fetchStatus, syncOffline } =
    useTutorialProgressStore();
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const user = useAuthStore((state) => state.user);
  const isStudent = user?.role?.toLowerCase() === 'student';
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
              ? "Network error: please check API_BASE_URL and backend server."
              : "Failed to load tutorials";
          toast.error(msg);
        } else {
          setTutorials(tutorialRes || []);
        }

        if (categoryRes?.error) {
          const err = categoryRes.error;
          const msg =
            err.code === "ERR_NETWORK"
              ? "Network error: please check API_BASE_URL and backend server."
              : "Failed to load categories";
          toast.error(msg);
          console.error("Failed to load categories", err);
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
        await saveTutorialProgress(tutorialId, percent);
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
      : tutorials.filter((t) => t.category === activeTab);

  return (
    <section className="bg-gray-950 py-16 text-white">
      <motion.h2
        className="text-3xl sm:text-4xl font-bold text-center text-yellow-400 mb-4"
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        📚 {t('featured_tutorials_heading')}
      </motion.h2>

      <p className="text-center text-gray-300 mb-10">
        {t('featured_tutorials_text')}
      </p>

      {/* Category Tabs */}
      <div className="flex justify-center gap-4 flex-wrap mb-8">
        {[{ label: "All", value: "All" }, ...categories.map((c) => ({ label: c.name, value: c.name }))].map((tab) => (
          <button
            key={tab.value}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
              activeTab === tab.value
                ? "bg-yellow-500 text-black border-yellow-400"
                : "bg-gray-800 text-yellow-300 border-gray-600"
            }`}
            onClick={() => setActiveTab(tab.value)}
            aria-label={`Show ${tab.label} tutorials`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tutorial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
        {filteredTutorials.map((tut, index) => {
          const isTopRated = Array.isArray(tut.tags) && tut.tags.includes("Top Rated");
          return (
          <motion.div
            key={tut.id}
            whileHover={{ scale: 1.03 }}
            className="bg-gray-800 rounded-lg overflow-hidden shadow-md cursor-pointer relative group"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
            onClick={() => router.push(`/tutorials/${tut.id}`)}
          >
            <div className="relative h-40">
              {!isMobile && tut.preview ? (
                <video
                  src={tut.preview}
                  autoPlay={!isMobile}
                  muted
                  playsInline
                  loop
                  poster={tut.thumbnail || "/images/logo.png"}
                  title={tut.title}
                  className="w-full h-full object-cover group-hover:brightness-75"
                />
              ) : (
                <Image
                  src={tut.thumbnail || "/images/logo.png"}
                  alt={tut.title}
                  fill
                  className="object-cover group-hover:brightness-75"
                  placeholder="blur"
                  blurDataURL="/images/logo.png"
                  sizes="100vw"
                />
              )}
              {(isTopRated || tut.trending) && (
                <span
                  className={`absolute top-2 left-2 px-2 py-1 text-xs rounded-full shadow text-white ${
                    isTopRated ? "bg-red-600" : "bg-orange-600"
                  }`}
                >
                  {isTopRated ? "🔥 Top Rated" : "🔥 Trending"}
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!user) return router.push('/auth/login');
                  if (!isStudent) {
                    toast.error('Only students can save tutorials.');
                    return;
                  }
                  try {
                    if (favoriteIds.includes(tut.id)) {
                      await removeTutorialFromFavorites(tut.id);
                      const updated = await getMyTutorialFavorites();
                      setFavoriteIds(updated.map((t) => t.id));
                      toast.success('Removed from favorites');
                    } else {
                      await addTutorialToFavorites(tut.id);
                      const updated = await getMyTutorialFavorites();
                      setFavoriteIds(updated.map((t) => t.id));
                      toast.success('Added to favorites');
                    }
                  } catch (err) {
                    const message = err?.response?.data?.message || 'Failed to update favorites';
                    toast.error(message);
                  }
                }}
                aria-label={favoriteIds.includes(tut.id) ? 'Remove from favorites' : 'Add to favorites'}
                className="absolute top-2 right-10 bg-gray-700 rounded-full p-1 w-6 h-6 flex items-center justify-center hover:text-red-400"
              >
                <FaHeart className={favoriteIds.includes(tut.id) ? 'text-red-500' : 'text-white'} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!user) return router.push('/auth/login');
                  if (!isStudent) {
                    toast.error('Only students can save tutorials.');
                    return;
                  }
                    try {
                      if (wishlistIds.includes(tut.id)) {
                        await removeTutorialFromWishlist(tut.id);
                        const updated = await getMyTutorialWishlist();
                        setWishlistIds(updated.map((t) => t.id));
                        toast.success('Removed from wishlist');
                      } else {
                        await addTutorialToWishlist(tut.id);
                        const updated = await getMyTutorialWishlist();
                        setWishlistIds(updated.map((t) => t.id));
                        toast.success(t('added_to_wishlist'));
                      }
                    } catch (err) {
                      const message = err?.response?.data?.message || 'Failed to update wishlist';
                      toast.error(message);
                    }
                  }}
                  aria-label={wishlistIds.includes(tut.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  className="absolute top-2 right-2 bg-gray-700 rounded-full p-1 w-6 h-6 flex items-center justify-center hover:text-yellow-400"
                >
                  <FaBookmark className={wishlistIds.includes(tut.id) ? 'text-yellow-400' : 'text-white'} />
              </button>
            </div>

            <div className="p-4">
              <h3 className="font-bold text-yellow-400 text-lg mb-1 truncate">
                {tut.title}
              </h3>
              <p className="text-sm text-gray-300 truncate">
                Instructor: {tut.instructor}
              </p>

              <div className="flex flex-wrap gap-2 mt-2 text-xs">
                <span className="bg-yellow-500 text-black px-2 py-1 rounded-full font-semibold">
                  {tut.level}
                </span>
                {Array.isArray(tut.tags) &&
                  tut.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="bg-gray-700 px-2 py-1 rounded-full text-yellow-300"
                      title={`Tag: ${tag}`}
                    >
                      #{tag}
                    </span>
                  ))}
              </div>

              <div className="flex justify-between mt-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  {getStars(tut.rating)}
                </span>
                <span className="flex items-center gap-1">
                  <FaClock /> {tut.duration}
                </span>
              </div>

              <div className="mt-2">
                <span
                  className={`px-2 py-1 rounded-full text-sm font-semibold ${
                    Number(tut.price) > 0
                      ? 'bg-yellow-500 text-black'
                      : 'bg-green-500 text-black'
                  }`}
                >
                  {Number(tut.price) > 0
                    ? formatCurrency(tut.price, { currency: tut.currencyCode })
                    : t('free')}
                </span>
              </div>

              {/* Progress Bar or Enroll Prompt */}
              {enrolledIds.includes(tut.id) ? (
                <div className="mt-3">
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{ width: `${progress[tut.id] || 0}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Watched: {progress[tut.id] || 0}%
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-center text-sm text-yellow-400 font-semibold">
                  Enroll
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button

                  aria-label="View tutorial details"

                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/tutorials/${tut.id}`);
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-1 rounded"
                >
                  {t('view_details')}
                </button>
                <button

                  aria-label="Add tutorial to cart"

                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!user) return router.push('/auth/login');
                    if (!isStudent) {
                      toast.error('Only students can purchase tutorials.');
                      return;
                    }
                    try {
                      await addItem({
                        id: tut.id,
                        name: tut.title,
                        item_type: 'tutorial',
                        price: tut.price || 0,
                      });
                      toast.success('Added to cart');
                    } catch (err) {
                      toast.error('Failed to add to cart');
                    }
                  }}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black py-1 rounded"
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
          className="inline-block bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-full font-semibold transition"
        >
          {t('explore_all_tutorials')}
        </motion.a>
      </div>
    </section>
  );
};

export default LandingTutorialsSection;
