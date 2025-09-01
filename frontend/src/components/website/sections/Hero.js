import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Typewriter from "typewriter-effect";
import SearchBar from "@/components/shared/SearchBar";
import { useSwipeable } from "react-swipeable"; // ✅ New for mobile swipe
import Image from "next/image";
import {
  FaBars,
  FaRobot,
  FaSearch,
  FaArrowRight,
  FaChalkboardTeacher,
  FaBookOpen,
  FaBook,
  FaMouse,
  FaChevronLeft,
  FaChevronRight,
  FaQuestionCircle,
  FaSearchPlus,
} from "react-icons/fa";
import AdMediaModal from "@/components/website/AdMediaModal";
import SidebarMenu from "@/components/shared/SidebarMenu";
import Chatbot from "@/components/shared/Chatbot";
import useAppConfigStore from "@/store/appConfigStore";
import { API_BASE_URL } from "@/config/config";
import { fetchAds, recordAdView, recordAdClick } from "@/services/adsService";
import { searchAll } from "@/services/searchService";
import { useTranslation } from "next-i18next";
import useAuthStore from "@/store/auth/authStore";


const Hero = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [ads, setAds] = useState([]);
  const [currentAd, setCurrentAd] = useState(0);
  const [showMedia, setShowMedia] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState(null);
  const [searchError, setSearchError] = useState(false);
  const [loadingAds, setLoadingAds] = useState(true);
  const [adsError, setAdsError] = useState(false);
  const [isAdPaused, setIsAdPaused] = useState(false);
  const hasResults =
    results &&
    Object.values(results).some(
      (arr) => Array.isArray(arr) && arr.length > 0
    );
  const settings = useAppConfigStore((s) => s.settings);
  const fetchAppConfig = useAppConfigStore((s) => s.fetch);
  const configLoaded = useAppConfigStore((s) => s.loaded);
  const { t } = useTranslation("website");
  const userRole = useAuthStore((s) => s.user?.roles?.[0] || s.user?.role);

  const [heroBg, setHeroBg] = useState("");

  useEffect(() => {
    const bg = settings.home_bg_url;
    if (!bg) {
      setHeroBg("");
      return;
    }
    let base = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL;
    if (!base.startsWith("http") && typeof window !== "undefined") {
      base = window.location.origin + base;
    }
    const normalizedBg = bg.startsWith("http")
      ? bg
      : `${base.replace(/\/$/, "")}${bg.startsWith("/") ? bg : `/${bg}`}`;
    setHeroBg(normalizedBg);
  }, [settings.home_bg_url]);

  // Always fetch latest configuration so hero background stays in sync
  useEffect(() => {
    fetchAppConfig();
  }, [fetchAppConfig]);

  const typewriterText = [
    t("hero_slogan_1"),
    t("hero_slogan_2"),
    t("hero_slogan_3"),
  ];

  useEffect(() => {
    const loadAds = async () => {
      setLoadingAds(true);
      try {
        const normalizedRole = userRole?.toLowerCase();
        const roleParam =
          normalizedRole === "admin" || normalizedRole === "superadmin"
            ? undefined
            : normalizedRole || "student";
        const { data } = await fetchAds({ role: roleParam });
        setAds(data);
        setAdsError(false);
      } catch (_err) {
        setAds([]);
        setAdsError(true);
      } finally {
        setLoadingAds(false);
      }
    };
    loadAds();
  }, [userRole]);

  const AD_ROTATION_INTERVAL = 10000; // ms
  // Auto-rotate Ads Every 10 Seconds, pause when focused/hovered
  useEffect(() => {
    if (!ads.length || isAdPaused) return;
    const interval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % ads.length);
    }, AD_ROTATION_INTERVAL);
    return () => clearInterval(interval);
  }, [ads, isAdPaused]);

  // Record a view whenever the current ad changes
  useEffect(() => {
    if (ads[currentAd]) {
      recordAdView(ads[currentAd].id);
    }
  }, [ads, currentAd]);

  // Auto search when user types with small debounce
  useEffect(() => {
    if (!searchText.trim()) {
      setResults(null);
      return;
    }

    const timeout = setTimeout(() => {
      handleSearch(searchText);
    }, 500);

    return () => clearTimeout(timeout);
  }, [searchText]);


  // Handle Ad Navigation
  const prevAd = () => setCurrentAd((prev) => (prev === 0 ? ads.length - 1 : prev - 1));
  const nextAd = () => setCurrentAd((prev) => (prev + 1) % ads.length);

  // Swipe gestures for mobile
  const handlers = useSwipeable({
    onSwipedLeft: nextAd,
    onSwipedRight: prevAd,
    trackMouse: true,
  });

  const handleSearch = async (query) => {
    const term = query.trim();
    if (!term) return;
    try {
      const data = await searchAll(term);
      setResults(data);
      setSearchError(false);
    } catch (_err) {
      setResults(null);
      setSearchError(true);
    }
  };

  const handleSearchSelect = (selectedValue) => {
    setSearchText(selectedValue);
    handleSearch(selectedValue);
  };

  const scrollToSection = (id) => {
    if (typeof document !== "undefined") {
      const el = document.getElementById(id);
      el && el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <section className="relative w-full min-h-screen flex flex-col lg:flex-row items-center justify-between text-gray-900 overflow-hidden px-6">

        {/* Sidebar & Chatbot */}
        <SidebarMenu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <Chatbot isOpen={isChatOpen} onToggle={setIsChatOpen} />

        {/* Floating Sidebar Button */}
        <motion.button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed left-4 top-1/2 transform -translate-y-1/2 bg-yellow-500 text-gray-900 p-4 rounded-r-full shadow-xl hover:bg-yellow-600 transition z-50 flex items-center gap-2"
          whileHover={{ scale: 1.2, rotate: 5 }}
        >
          <FaBars size={22} />
        </motion.button>

        {/* Floating Chatbot Button */}
        <motion.button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="fixed right-4 top-1/2 transform -translate-y-1/2 bg-yellow-500 text-gray-900 p-4 rounded-l-full shadow-xl hover:bg-yellow-600 transition z-50 flex items-center gap-2"
          whileHover={{ scale: 1.2, rotate: -5 }}
        >
          <FaRobot size={22} />
        </motion.button>

        {/* Background Image with Overlay */}
        <div className="absolute inset-0 w-full h-full">
          {heroBg && (
            <Image
              src={heroBg}
              alt="Learning Illustration"
              fill
              className="object-cover"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
        </div>

        {/* Left Content */}
        <div className="relative z-10 text-center lg:text-left lg:w-1/2">
          <motion.h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-white drop-shadow-lg">
            <Typewriter options={{ strings: typewriterText, autoStart: true, loop: true }} />
          </motion.h1>

          {/* 🔍 Modern Search Box */}
          <div className="relative w-full max-w-lg mx-auto mb-6">
            <div className="flex">
              <div className="flex-grow">
                <SearchBar
                  value={searchText}
                  onChange={setSearchText}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchText)}
                  label="Search courses, books and more"
                />
              </div>
              <button
                onClick={() => handleSearch(searchText)}
                aria-label="Search"
                className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FaSearch />
              </button>
            </div>
            {results && (
              <div
                className="absolute mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-20 max-h-80 overflow-y-auto text-left"
                role="listbox"
                aria-label="Search results"
                aria-live="polite"
              >
                {results && (
                  <>
                    <div className="py-1">
                      <h3 className="px-4 py-1 text-sm font-semibold text-gray-500">
                        📚 Online Classes ({results.classes?.length || 0})
                      </h3>
                      <ul>
                        {results.classes?.map((c) => (
                          <li key={`c-${c.id}`}>
                            <Link href={`/online-classes/${c.id}`}>
                              <span
                                role="option"
                                tabIndex={0}
                                className="block px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              >
                                {c.title}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="py-1">
                      <h3 className="px-4 py-1 text-sm font-semibold text-gray-500">
                        📘 Tutorials ({results.tutorials?.length || 0})
                      </h3>
                      <ul>
                        {results.tutorials?.map((t) => (
                          <li key={`t-${t.id}`}>
                            <Link href={`/tutorials/${t.id}`}>
                              <span
                                role="option"
                                tabIndex={0}
                                className="block px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              >
                                {t.title}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="py-1">
                      <h3 className="px-4 py-1 text-sm font-semibold text-gray-500">
                        📖 Books ({results.books?.length || 0})
                      </h3>
                      <ul>
                        {results.books?.map((b) => (
                          <li key={`b-${b.id}`}>
                            <Link href={`/marketplace/books/${b.id}`}>
                              <span
                                role="option"
                                tabIndex={0}
                                className="block px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              >
                                {b.title}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="py-1">
                      <h3 className="px-4 py-1 text-sm font-semibold text-gray-500">
                        👩‍🏫 Instructors ({results.instructors?.length || 0})
                      </h3>
                      <ul>
                        {results.instructors?.map((i) => (
                          <li key={`i-${i.id}`}>
                            <Link href={`/instructors/${i.id}`}>
                              <span
                                role="option"
                                tabIndex={0}
                                className="block px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              >
                                {i.full_name}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="py-1">
                      <h3 className="px-4 py-1 text-sm font-semibold text-gray-500">
                        💼 Offers ({results.offers?.length || 0})
                      </h3>
                      <ul>
                        {results.offers?.map((o) => (
                          <li key={`o-${o.id}`}>
                            <Link href={`/offers/${o.id}`}>
                              <span
                                role="option"
                                tabIndex={0}
                                className="block px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              >
                                {o.title}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="py-1">
                      <h3 className="px-4 py-1 text-sm font-semibold text-gray-500">
                        💬 Community ({results.community?.length || 0})
                      </h3>
                      <ul>
                        {results.community?.map((d) => (
                          <li key={`d-${d.id}`}>
                            <Link href={`/community/${d.id}`}>
                              <span
                                role="option"
                                tabIndex={0}
                                className="block px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              >
                                {d.title}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="py-1">
                      <h3 className="px-4 py-1 text-sm font-semibold text-gray-500">
                        📝 Blog ({results.blog?.length || 0})
                      </h3>
                      <ul>
                        {results.blog?.map((b) => (
                          <li key={`b-${b.id}`}>
                            <Link href={`/blog/${b.slug}`}>
                              <span
                                role="option"
                                tabIndex={0}
                                className="block px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              >
                                {b.title}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
                {!hasResults && (
                  <p className="px-4 py-2 text-sm text-gray-500">No results found.</p>
                )}
                {searchError && (
                  <p className="px-4 py-2 text-sm text-red-500">Search failed.</p>
                )}
              </div>
            )}
          </div>

          {/* CTA Buttons */}
          <motion.div className="flex flex-wrap justify-center gap-4">

            <button onClick={() => scrollToSection('community')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg flex items-center gap-2">
              <FaQuestionCircle /> {t('ask_question')}
            </button>

            <button onClick={() => scrollToSection('online-classes')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition shadow-lg flex items-center gap-2">
              <FaChalkboardTeacher /> {t('browse_online_classes')}
            </button>

            <button onClick={() => scrollToSection('tutorials')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition shadow-lg flex items-center gap-2">
              <FaBookOpen /> {t('explore_tutorials')}
            </button>

            <button onClick={() => scrollToSection('books')}
              className="px-6 py-3 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition shadow-lg flex items-center gap-2">
              <FaBook /> {t('explore_books')}
            </button>
          </motion.div>
        </div>

        {/* Right Side - Ads */}
        {ads.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={ads[currentAd].id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="relative w-full lg:w-1/2 h-[450px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 backdrop-blur-lg transition-all duration-500 group"
              onMouseEnter={() => setIsAdPaused(true)}
              onMouseLeave={() => setIsAdPaused(false)}
              onFocus={() => setIsAdPaused(true)}
              onBlur={() => setIsAdPaused(false)}
              onTouchStart={() => setIsAdPaused(true)}
              onTouchEnd={() => setIsAdPaused(false)}
              tabIndex={0}
              {...handlers}
            >
            {ads[currentAd].video ? (
              <video
                src={ads[currentAd].video}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
              />
            ) : (
              <Image
                src={ads[currentAd].image}
                alt={ads[currentAd].title}
                fill
                style={{ objectFit: "cover" }}
                className="object-cover"
                priority
              />
            )}
            {/* View Media Button */}
            <button
              onClick={() => {
                setIsAdPaused(true);
                setShowMedia(true);
              }}
              className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white"
              aria-label={t('view_media')}
            >
              <FaSearchPlus />
            </button>
            <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-transparent z-10 flex items-end justify-center pb-8 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
              <div className="px-6 md:px-10 max-w-xl text-white">
                <h3 className="text-2xl md:text-4xl font-bold mb-3 leading-snug drop-shadow-xl">
                  {ads[currentAd].title}
                </h3>
                <p className="text-base md:text-lg mb-4 drop-shadow-lg text-white/90">
                  {ads[currentAd].description}
                </p>
                <a
                  href={ads[currentAd].link}
                  onClick={() => recordAdClick(ads[currentAd].id)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition font-semibold shadow-md"
                >
                  {t('learn_more')} <FaArrowRight />
                </a>
              </div>
            </div>

            {/* Navigation Arrows */}
            <div className="absolute top-1/2 left-4 transform -translate-y-1/2 z-20">
              <button onClick={prevAd} className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white shadow-md">
                <FaChevronLeft />
              </button>
            </div>
            <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-20">
              <button onClick={nextAd} className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white shadow-md">
                <FaChevronRight />
              </button>
            </div>

            {/* Dot Indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
              {ads.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentAd(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${currentAd === index ? "bg-yellow-500 scale-110" : "bg-white/40"
                    }`}
                />
              ))}
            </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="relative w-full lg:w-1/2 h-[450px] flex items-center justify-center text-white text-xl">
            {loadingAds ? (
              <div className="w-full h-full bg-gray-700 animate-pulse rounded-2xl" />
            ) : adsError ? (
              <span>Failed to load ads.</span>
            ) : (
              <span>{t('no_offers')}</span>
            )}
          </div>
        )}



        {/* ✅ Mouse Scroll Indicator (ADDED) */}
        <motion.div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          <FaMouse className="text-white text-3xl animate-bounce" />
          <p className="text-white text-sm mt-2">{t('scroll_down')}</p>
        </motion.div>
        {showMedia && (
          <AdMediaModal
            ad={ads[currentAd]}
            onClose={() => {
              setShowMedia(false);
              setIsAdPaused(false);
            }}
          />
        )}
      </section>
    </motion.section>
  );
};

export default Hero;
