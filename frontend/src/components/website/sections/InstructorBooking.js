// ✅ Enhanced Instructor Booking UI Component with All Features
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import useAuthStore from '@/store/auth/authStore';
import { toast } from 'react-toastify';
import { fetchPublicInstructors } from '@/services/public/instructorService';
import BookingRequestModal from '@/components/student/instructors/BookingRequestModal';

import { motion } from 'framer-motion';
import {
  FaStar,
  FaUserCheck,
  FaComments,
  FaHeart,
  FaCircleCheck,
} from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { useTranslation } from "next-i18next";

// Use a relative API base URL by default so deployments work on any domain
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
const FALLBACK_AVATAR = "/images/profile/user.png";

const normalizeAvatar = (value) => {
  if (!value) return FALLBACK_AVATAR;
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  if (value.startsWith("/api/")) {
    return value;
  }
  const base = API_BASE_URL.replace(/\/$/, "");
  const path = value.startsWith("/") ? value : `/${value}`;
  return `${base}${path}`;
};

const normalizeRating = (raw) => {
  if (raw === null || raw === undefined) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const defaultCategories = ["All"];
const sortOptions = ["Highest Rated", "Most Experienced"];

export default function InstructorBooking() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useTranslation("website");

  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookingInstructor, setBookingInstructor] = useState(null);
  const [chatWithInstructor, setChatWithInstructor] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [sortBy, setSortBy] = useState("Highest Rated");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const data = await fetchPublicInstructors();
        const mapped = data.map((ins) => ({
          ...ins,
          id: ins.id,
          name: ins.full_name || ins.name || "—",
          avatar: normalizeAvatar(ins.avatar_url),
          rating: normalizeRating(ins.rating),
          tags: Array.isArray(ins.expertise)
            ? ins.expertise.filter(Boolean)
            : [],
          availableNow: Boolean(ins.is_online),
          verified: Boolean(
            ins.is_verified ?? ins.is_email_verified ?? ins.status === "active"
          ),
        }));
        setInstructors(mapped);
      } catch (err) {
        console.error('Failed to load instructors', err);
        setError('Unable to load instructors right now. Please try again later.');
        toast.error('Failed to load instructors. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const categories = useMemo(() => {
    const unique = new Set(defaultCategories);
    instructors.forEach((ins) => {
      if (Array.isArray(ins.expertise)) {
        ins.expertise.filter(Boolean).forEach((value) => unique.add(value));
      } else if (ins.expertise) {
        unique.add(ins.expertise);
      }
    });
    return Array.from(unique);
  }, [instructors]);

  const filtered = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    const selected = selectedCategory;

    return instructors
      .filter((instructor) => {
        if (onlyAvailable && !instructor.availableNow) return false;
        if (showFavoritesOnly && !favorites.includes(instructor.id)) return false;
        if (selected !== 'All') {
          const expertiseList = Array.isArray(instructor.expertise)
            ? instructor.expertise
            : [instructor.expertise].filter(Boolean);
          if (!expertiseList.includes(selected)) return false;
        }
        if (keyword && !instructor.name.toLowerCase().includes(keyword)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'Highest Rated') {
          return (b.rating ?? 0) - (a.rating ?? 0);
        }
        if (sortBy === 'Most Experienced') {
          const parseYears = (value) => {
            const numeric = parseInt(value, 10);
            return Number.isNaN(numeric) ? 0 : numeric;
          };
          return parseYears(b.experience) - parseYears(a.experience);
        }
        return 0;
      });
  }, [
    favorites,
    instructors,
    onlyAvailable,
    searchQuery,
    selectedCategory,
    showFavoritesOnly,
    sortBy,
  ]);

  const filtersActive = useMemo(
    () =>
      selectedCategory !== 'All' ||
      searchQuery.trim().length > 0 ||
      showFavoritesOnly ||
      onlyAvailable ||
      sortBy !== sortOptions[0],
    [onlyAvailable, searchQuery, selectedCategory, showFavoritesOnly, sortBy]
  );

  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const resetFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
    setSortBy(sortOptions[0]);
    setShowFavoritesOnly(false);
    setOnlyAvailable(false);
  };

  const handleRequest = async (instructor) => {
    if (!instructor?.availableNow) {
      toast.info(t('instructor_unavailable_message', 'This instructor is offline right now. Please check back soon.'));
      return;
    }
    if (!user || user.role?.toLowerCase() !== "student") {
      toast.info("Please login as a student or create a student account to proceed.");

      return;
    }
    setBookingInstructor(instructor);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="relative overflow-hidden py-16 text-white"
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-black"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-6xl px-4">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-yellow-400 md:text-5xl">
            {t('instructor_heading')}
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            {t('instructor_text')}
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-8">
          <div className="rounded-2xl bg-gray-800/70 p-6 shadow-xl backdrop-blur">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="relative lg:col-span-2">
                <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder={t('search_instructors_placeholder')}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-12 w-full rounded-xl border border-gray-700 bg-gray-900/60 pl-12 pr-4 text-sm text-gray-100 placeholder-gray-400 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                />
              </div>

              <select
                className="h-12 w-full rounded-xl border border-gray-700 bg-gray-900/60 px-4 text-sm text-gray-100 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                className="h-12 w-full rounded-xl border border-gray-700 bg-gray-900/60 px-4 text-sm text-gray-100 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                {sortOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={onlyAvailable}
                    onChange={(event) => setOnlyAvailable(event.target.checked)}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                  />
                  {t('instructor_only_available')}
                </label>

                <label className="inline-flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={showFavoritesOnly}
                    onChange={(event) => setShowFavoritesOnly(event.target.checked)}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                  />
                  {t('instructor_show_favorites')}
                </label>
              </div>

              {filtersActive && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="self-start rounded-full border border-gray-600 px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-yellow-400 hover:text-yellow-300"
                >
                  {t('instructor_clear_filters', 'Clear filters')}
                </button>
              )}
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-6 text-center text-sm text-rose-200">
              {error}
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-72 animate-pulse rounded-2xl bg-gray-800/60"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-300">
              {t('instructor_no_results')}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((i) => {
                const ratingValue = normalizeRating(i.rating);
                const hasRating = Number.isFinite(ratingValue) && ratingValue > 0;
                const roundedStars = hasRating ? Math.round(ratingValue) : 0;
                const ratingLabel = hasRating
                  ? Number.isInteger(ratingValue)
                    ? ratingValue
                    : ratingValue.toFixed(1)
                  : null;

                return (
                  <motion.div
                    key={i.id}
                    whileHover={{ scale: 1.05 }}
                    className="relative flex h-full flex-col items-center gap-4 rounded-2xl bg-gray-800/80 p-6 text-center shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <span
                      className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${
                        i.availableNow ? 'bg-emerald-500 text-emerald-900' : 'bg-gray-600 text-gray-200'
                      }`}
                    >
                      {i.availableNow ? t('instructor_online') : t('instructor_offline')}
                    </span>
                    {i.verified && (
                      <span className="absolute left-4 top-4 flex items-center gap-1 text-sm text-emerald-300">
                        <FaCircleCheck /> {t('instructor_verified')}
                      </span>
                    )}
                    <img
                      src={i.avatar}
                      className="h-20 w-20 rounded-full border-2 border-yellow-400 object-cover"
                      alt={i.name}
                    />
                    <h3
                      className="text-xl font-semibold hover:underline"
                      onClick={() => router.push(`/instructors/${i.id}`)}
                    >
                      {i.name}
                    </h3>
                    <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-300">
                      {(Array.isArray(i.expertise) ? i.expertise : [i.expertise]).filter(Boolean).map((exp, idx) => (
                        <span key={exp || idx} className="rounded-full bg-gray-700/80 px-3 py-1">
                          {exp}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-400">
                      {t('experience_years', { count: i.experience })}
                    </p>
                    <div className="flex items-center justify-center gap-1">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <FaStar
                          key={idx}
                          className={idx < roundedStars ? 'text-yellow-400' : 'text-gray-600'}
                        />
                      ))}
                      <span className="text-sm text-gray-300">
                        {hasRating
                          ? t('instructor_rating', { count: ratingLabel })
                          : t('no_reviews')}
                      </span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                      <button
                        onClick={() => handleRequest(i)}
                        disabled={!i.availableNow}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                          i.availableNow
                            ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                            : 'bg-gray-600/60 text-gray-300 cursor-not-allowed'
                        }`}
                      >
                        <FaUserCheck /> {i.availableNow ? t('instructor_request_lesson') : t('instructor_offline_cta', 'Offline')}
                      </button>
                      <button
                        onClick={() => setChatWithInstructor(i.id)}
                        className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
                      >
                        <FaComments /> {t('instructor_chat')}
                      </button>
                      <button
                        onClick={() => toggleFavorite(i.id)}
                        className={`inline-flex items-center justify-center rounded-full px-3 py-2 text-sm transition ${favorites.includes(i.id) ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                        aria-label={favorites.includes(i.id) ? 'Remove from favorites' : 'Save to favorites'}
                      >
                        <FaHeart />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {bookingInstructor && (
        <BookingRequestModal
          instructor={bookingInstructor}
          onClose={() => setBookingInstructor(null)}
        />
      )}

      {/* Chat Modal */}
      {chatWithInstructor && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-60 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 p-6 rounded-xl max-w-md text-center"
          >
            <h3 className="text-xl font-bold mb-3">{t("instructor_open_chat")}</h3>
            <p className="text-gray-300">{t("instructor_start_chat")}</p>
            <button
              onClick={() => {
                setChatWithInstructor(null);
                router.push(`/messages?userId=${chatWithInstructor}`);
              }}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
            >
              <FaComments /> {t("instructor_go_to_chat")}
            </button>
          </motion.div>
        </div>
      )}
    </motion.section>
  );
}
