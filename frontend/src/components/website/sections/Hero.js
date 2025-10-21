import { useState, useEffect, useRef, useCallback, Fragment, useMemo } from "react";
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
  FaSpinner,
  FaTimes,
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

const SITE_SECTIONS = [
  {
    id: "section-online-classes",
    label: "Online Classes",
    href: "/online-classes",
    keywords: ["class", "classes", "course", "courses", "live learning"],
  },
  {
    id: "section-tutorials",
    label: "Tutorials",
    href: "/tutorials",
    keywords: ["tutorial", "tutorials", "recorded lessons"],
  },
  {
    id: "section-books",
    label: "Books Marketplace",
    href: "/marketplace/books",
    keywords: ["book", "books", "library", "marketplace", "ebook"],
  },
  {
    id: "section-offers",
    label: "Offers & Scholarships",
    href: "/offers",
    keywords: ["offer", "offers", "discount", "discounts", "scholarship"],
  },
  {
    id: "section-community",
    label: "Community Forum",
    href: "/community",
    keywords: ["community", "forum", "discussions", "groups"],
  },
  {
    id: "section-blog",
    label: "Blog & News",
    href: "/blog",
    keywords: ["blog", "news", "articles", "insights"],
  },
  {
    id: "section-faqs",
    label: "FAQs",
    href: "/faqs",
    keywords: ["faq", "faqs", "questions", "help"],
  },
  {
    id: "section-support",
    label: "Help & Support",
    href: "/support",
    keywords: ["support", "help", "ticket", "assistance"],
  },
  {
    id: "section-contact",
    label: "Contact",
    href: "/contact",
    keywords: ["contact", "email", "phone", "get in touch"],
  },
  {
    id: "section-about",
    label: "About SkillBridge",
    href: "/about",
    keywords: ["about", "mission", "team", "story"],
  },
  {
    id: "section-dashboard",
    label: "Dashboard",
    href: "/dashboard",
    keywords: ["dashboard", "profile", "account", "portal"],
  },
];

const SEARCH_SECTIONS = [
  {
    key: "sections",
    title: "🌐 Site Sections",
    href: (item) => item.href,
    getLabel: (item) => item.title,
    getKey: (item) => item.id,
  },
  {
    key: "classes",
    title: "📚 Online Classes",
    href: (item) => `/online-classes/${item.id}`,
    getLabel: (item) => item.title,
    getKey: (item) => `class-${item.id}`,
  },
  {
    key: "tutorials",
    title: "📘 Tutorials",
    href: (item) => `/tutorials/${item.id}`,
    getLabel: (item) => item.title,
    getKey: (item) => `tutorial-${item.id}`,
  },
  {
    key: "books",
    title: "📖 Books",
    href: (item) => `/marketplace/books/${item.id}`,
    getLabel: (item) => item.title,
    getKey: (item) => `book-${item.id}`,
  },
  {
    key: "instructors",
    title: "👩‍🏫 Instructors",
    href: (item) => `/instructors/${item.id}`,
    getLabel: (item) => item.full_name || item.name,
    getKey: (item) => `instructor-${item.id}`,
  },
  {
    key: "offers",
    title: "💼 Offers",
    href: (item) => `/offers/${item.id}`,
    getLabel: (item) => item.title,
    getKey: (item) => `offer-${item.id}`,
  },
  {
    key: "community",
    title: "💬 Community",
    href: (item) => `/community/${item.id}`,
    getLabel: (item) => item.title,
    getKey: (item) => `community-${item.id}`,
  },
  {
    key: "blog",
    title: "📝 Blog",
    href: (item) => `/blog/${item.slug || item.id}`,
    getLabel: (item) => item.title,
    getKey: (item) => `blog-${item.slug || item.id}`,
  },
];

const escapeRegExp = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");


const Hero = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [ads, setAds] = useState([]);
  const [currentAd, setCurrentAd] = useState(0);
  const [showMedia, setShowMedia] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState(null);
  const [searchError, setSearchError] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingAds, setLoadingAds] = useState(true);
  const [adsError, setAdsError] = useState(false);
  const [isAdPaused, setIsAdPaused] = useState(false);
  const searchContainerRef = useRef(null);
  const latestQueryRef = useRef("");
  const hasResults = useMemo(() => {
    if (!results) return false;
    return Object.values(results).some(
      (arr) => Array.isArray(arr) && arr.length > 0
    );
  }, [results]);
  const settings = useAppConfigStore((s) => s.settings);
  const fetchAppConfig = useAppConfigStore((s) => s.fetch);
  const { t } = useTranslation("website");
  const isLoggedIn = useAuthStore((s) => s.isAuthenticated());
  const userRole = useAuthStore((s) => s.user?.roles?.[0] || s.user?.role);

  const [heroBg, setHeroBg] = useState("");

  const matchSiteSections = useCallback((term) => {
    const query = term.trim().toLowerCase();
    if (!query) return [];
    const parts = query.split(/\s+/).filter(Boolean);
    return SITE_SECTIONS.filter((section) => {
      const haystack = [section.label, ...(section.keywords || [])]
        .join(" ")
        .toLowerCase();
      return (
        haystack.includes(query) ||
        parts.some((part) => haystack.includes(part))
      );
    }).map((section) => ({
      id: section.id,
      title: section.label,
      href: section.href,
    }));
  }, []);

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

  const handleSearch = useCallback(async (query) => {
    const term = query.trim();
    if (!term) return;
    const staticMatches = matchSiteSections(term);
    latestQueryRef.current = term;
    setSearchError(false);
    setResults({ sections: staticMatches });
    setIsDropdownOpen(true);
    setIsSearching(true);
    try {
      const data = await searchAll(term);
      if (latestQueryRef.current !== term) {
        return;
      }
      const normalizedResults =
        data && typeof data === "object" ? data : {};
      setResults({
        sections: staticMatches,
        ...normalizedResults,
      });
      setSearchError(false);
    } catch (_err) {
      if (latestQueryRef.current !== term) {
        return;
      }
      setResults({ sections: staticMatches });
      setSearchError(true);
    } finally {
      if (latestQueryRef.current === term) {
        setIsSearching(false);
      }
    }
  }, [matchSiteSections]);

  // Auto search when user types with small debounce
  useEffect(() => {
    const term = searchText.trim();
    if (!term) {
      latestQueryRef.current = "";
      setResults(null);
      setSearchError(false);
      setIsDropdownOpen(false);
      setIsSearching(false);
      return;
    }

    const timeout = setTimeout(() => {
      handleSearch(searchText);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchText, handleSearch]);


  // Handle Ad Navigation
  const prevAd = () => setCurrentAd((prev) => (prev === 0 ? ads.length - 1 : prev - 1));
  const nextAd = () => setCurrentAd((prev) => (prev + 1) % ads.length);

  // Swipe gestures for mobile
  const handlers = useSwipeable({
    onSwipedLeft: nextAd,
    onSwipedRight: prevAd,
    trackMouse: true,
  });

  const clearSearch = useCallback(() => {
    setSearchText("");
    setResults(null);
    setSearchError(false);
    setIsDropdownOpen(false);
    setIsSearching(false);
    latestQueryRef.current = "";
  }, []);

  const highlightMatch = useCallback(
    (text = "") => {
      const term = searchText.trim();
      if (!term || typeof text !== "string") return text;
      const regex = new RegExp(`(${escapeRegExp(term)})`, "ig");
      return text.split(regex).map((part, idx) => {
        if (part.toLowerCase() === term.toLowerCase()) {
          return (
            <mark
              key={`highlight-${idx}`}
              className="bg-yellow-200 text-gray-900 px-0.5 rounded"
            >
              {part}
            </mark>
          );
        }
        return <Fragment key={`fragment-${idx}`}>{part}</Fragment>;
      });
    },
    [searchText],
  );

  const handleResultNavigate = useCallback(() => {
    clearSearch();
  }, [clearSearch]);

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDropdownOpen]);

  const scrollToSection = (id) => {
    if (typeof document !== "undefined") {
      const el = document.getElementById(id);
      el && el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const trimmedQuery = searchText.trim();
  const resultsId = "hero-search-results";
  const shouldShowDropdown =
    isDropdownOpen &&
    (isSearching || searchError || hasResults || !!trimmedQuery);

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
          <div
            ref={searchContainerRef}
            className="relative w-full max-w-lg mx-auto mb-6"
          >
            <div className="flex items-center gap-2">
              <div className="flex-grow">
                <SearchBar
                  value={searchText}
                  onChange={setSearchText}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSearch(searchText);
                    } else if (event.key === "Escape") {
                      setIsDropdownOpen(false);
                    }
                  }}
                  onFocus={() => {
                    if (searchText.trim()) {
                      setIsDropdownOpen(true);
                    }
                  }}
                  label={t("hero_search_label", {
                    defaultValue: "Search courses, books and more",
                  })}
                  placeholder={t("hero_search_placeholder", {
                    defaultValue:
                      "Search courses, tutorials, books, instructors…",
                  })}
                  aria-controls={resultsId}
                  aria-expanded={shouldShowDropdown}
                  aria-autocomplete="list"
                  inputMode="search"
                />
              </div>
              {searchText && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="px-3 py-2 text-white/80 hover:text-white focus:outline-none"
                  aria-label={t("clear_search", { defaultValue: "Clear search" })}
                >
                  <FaTimes />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSearch(searchText)}
                aria-label={t("perform_search", { defaultValue: "Search" })}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={!trimmedQuery || isSearching}
              >
                {isSearching ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaSearch />
                )}
              </button>
            </div>
            <AnimatePresence>
              {shouldShowDropdown && (
                <motion.div
                  key="hero-search-results"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  id={resultsId}
                  className="absolute mt-2 w-full bg-white border border-gray-200 rounded-md shadow-2xl z-20 max-h-80 overflow-y-auto text-left"
                  role="listbox"
                  aria-label={t("search_results_label", {
                    defaultValue: "Search results",
                  })}
                  aria-live="polite"
                >
                  {isSearching && (
                    <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-600">
                      <FaSpinner className="animate-spin" />
                      <span>
                        {t("searching", { defaultValue: "Searching…" })}
                      </span>
                    </div>
                  )}
                  {!isSearching && searchError && (
                    <div className="px-4 py-3 text-sm text-red-600">
                      {t("search_failed", {
                        defaultValue:
                          "We couldn't complete your search. Please try again.",
                      })}
                    </div>
                  )}
                  {!isSearching && !searchError && hasResults && (
                    <Fragment>
                      {SEARCH_SECTIONS.map((section) => {
                        const items = results?.[section.key];
                        if (!Array.isArray(items) || !items.length) return null;
                        return (
                          <div key={section.key} className="py-2">
                            <h3 className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              {section.title} ({items.length})
                            </h3>
                            <ul>
                              {items.map((item) => {
                                const label =
                                  section.getLabel(item) ||
                                  t("search_untitled", {
                                    defaultValue: "Untitled",
                                  });
                                return (
                                  <li key={section.getKey(item)}>
                                    <Link href={section.href(item)} prefetch={false}>
                                      <span
                                        role="option"
                                        tabIndex={0}
                                        className="block px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer transition-colors"
                                        onClick={handleResultNavigate}
                                      >
                                        {highlightMatch(label)}
                                      </span>
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        );
                      })}
                    </Fragment>
                  )}
                  {!isSearching && !searchError && !hasResults && !!trimmedQuery && (
                    <div className="px-4 py-3 text-sm text-gray-600">
                      {t("search_no_results", {
                        defaultValue: "No results match your query.",
                      })}
                    </div>
                  )}
                  {!isLoggedIn && (
                    <div className="px-4 py-3 bg-slate-50 border-t border-gray-200 text-xs text-gray-600 flex items-center justify-between gap-4">
                      <span>
                        {t("search_guest_hint", {
                          defaultValue:
                            "Sign in to enroll and save your learning journey.",
                        })}
                      </span>
                      <Link
                        href="/auth/login"
                        className="text-blue-600 font-semibold hover:underline"
                        onClick={handleResultNavigate}
                      >
                        {t("login", { defaultValue: "Login" })}
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
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
