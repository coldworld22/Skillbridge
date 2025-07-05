"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaStar, FaClock, FaFire, FaEye, FaArrowUp } from "react-icons/fa";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import FilterSidebar from "@/components/tutorials/FilterSidebar";
import { fetchPublishedTutorials } from "@/services/tutorialService";

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
    price: 100,
  });
  const router = useRouter();
  const loader = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleFilterChange = (f) => {
    setFilters(f);
    setVisibleCount(6);
  };

  const resetFilters = () => {
    setFilters({ categories: [], levels: [], price: 100 });
  };

  useEffect(() => {
    const loadTutorials = async () => {
      try {
        const data = await fetchPublishedTutorials();
        setTutorials(data?.data || data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load tutorials");
      } finally {
        setLoading(false);
      }
    };
    loadTutorials();
  }, []);

  const filteredTutorials = tutorials.filter((tut) => {
    const matchCategory =
      !filters.categories.length ||
      filters.categories.includes(tut.category_name) ||
      (tut.tags || []).some((tag) => filters.categories.includes(tag));

    const matchLevel =
      !filters.levels.length || filters.levels.includes(tut.level);

    const matchPrice =
      !filters.price ||
      !tut.is_paid ||
      (tut.price != null && Number(tut.price) <= Number(filters.price));

    const matchSearch =
      tut.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tut.instructor.toLowerCase().includes(searchQuery.toLowerCase());

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
      { threshold: 1 },
    );

    if (loader.current) observer.observe(loader.current);

    return () => {
      if (loader.current) observer.unobserve(loader.current);
    };
  }, [loader, sortedTutorials.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-yellow-400">
        ⏳ Loading tutorials...
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
    <section className="bg-gray-900 text-white min-h-screen relative">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.h2 className="text-3xl sm:text-4xl font-bold mb-6 text-yellow-500 text-center">
          📺 Top Tutorials
        </motion.h2>
        <p className="text-md sm:text-lg text-gray-300 mb-8 text-center">
          Learn from trending, top-rated, and beginner-friendly content.
        </p>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/4 w-full">
            <FilterSidebar
              onFilterChange={handleFilterChange}
              onResetFilters={resetFilters}
            />
          </div>

          <div className="flex-grow">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Search tutorials..."
                className="p-2 rounded bg-gray-800 text-white border border-gray-600 w-full sm:w-auto"
              />

              <select
                onChange={(e) => setSortBy(e.target.value)}
                className="p-2 rounded bg-gray-800 text-yellow-400 border border-yellow-500"
              >
                <option value="default">Sort by</option>
                <option value="views">Most Viewed</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleTutorials.map((tut) => {
                const enrolled =
                  typeof window !== "undefined" &&
                  localStorage.getItem(`enrolled-${tut.id}`);

                let progressPercent = 0;
                if (typeof window !== "undefined") {
                  const saved = localStorage.getItem(
                    `progress-tutorial-${tut.id}`,
                  );
                  if (saved) {
                    try {
                      const data = JSON.parse(saved);
                      const total = Array.isArray(tut.chapters)
                        ? tut.chapters.length
                        : tut.totalLessons ||
                          tut.total_chapters ||
                          tut.chapter_count ||
                          0;
                      if (total) {
                        progressPercent =
                          ((data.completedChapters?.length || 0) / total) * 100;
                      }
                    } catch {}
                  }
                }
                return (
                  <motion.div
                    key={tut.id}
                    whileHover={{ scale: 1.03 }}
                    className="bg-gray-800 rounded-lg shadow-lg overflow-hidden text-left relative group cursor-pointer"
                    onClick={() => router.push(`/tutorials/${tut.id}`)}
                  >
                    <div className="relative h-40">
                      {tut.preview ? (
                        <video
                          className="w-full h-full object-cover group-hover:brightness-75"
                          src={tut.preview}
                          autoPlay
                          muted
                          loop
                        />
                      ) : (
                        <img
                          src={tut.thumbnail}
                          alt={tut.title}
                          className="w-full h-full object-cover group-hover:brightness-75"
                        />
                      )}
                      {tut.trending && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-xs rounded-full shadow">
                          🔥 Trending
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-lg text-yellow-400 mb-1">
                        {tut.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        {(() => {
                          const avatar =
                            tut.instructorAvatar ||
                            tut.instructor_avatar ||
                            tut.instructor_avatar_url;
                          return (
                            <img
                              src={avatar || "/images/default-avatar.png"}
                              alt={tut.instructor}
                              className="w-6 h-6 rounded-full"
                            />
                          );
                        })()}

                        <span>{tut.instructor}</span>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-2 text-xs">
                        <span className="bg-yellow-500 text-black px-2 py-1 rounded-full font-semibold">
                          {tut.level}
                        </span>
                        {tut.tags?.map((tag, i) => (
                          <span
                            key={i}
                            className="bg-gray-700 px-2 py-1 rounded-full text-yellow-300"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <FaStar className="text-yellow-400" /> {tut.rating}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaEye /> {tut.views} views
                        </span>
                        <span className="flex items-center gap-1">
                          <FaClock /> {tut.duration}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-sm text-gray-300">
                        <span>
                          {tut.is_paid && tut.price ? `$${tut.price}` : "Free"}
                        </span>
                        {enrolled && (
                          <span className="bg-green-600 text-white px-2 py-0.5 rounded-full text-xs">
                            Enrolled
                          </span>
                        )}
                      </div>

                      {enrolled && (
                        <div className="w-full bg-gray-700 h-2 rounded-full relative mt-2">
                          <div className="absolute right-1 -top-4 text-xs text-gray-400">
                            {Math.round(progressPercent)}%
                          </div>
                          <div
                            className="h-2 bg-yellow-500 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              {visibleTutorials.length === 0 && (
                <p className="col-span-full text-center text-gray-400">
                  No tutorials found.
                </p>
              )}
            </div>

            {visibleCount < sortedTutorials.length && (
              <div ref={loader} className="text-center mt-6 text-gray-400">
                ⏳ Loading more tutorials...
              </div>
            )}
          </div>
        </div>
      </div>

      {showScrollToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-5 right-5 bg-yellow-500 text-black p-3 rounded-full shadow-lg hover:bg-yellow-600 transition"
        >
          <FaArrowUp />
        </button>
      )}

      <Footer />
    </section>
  );
};

export default TutorialsSection;
