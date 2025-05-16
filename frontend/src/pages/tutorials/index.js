import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaStar, FaClock, FaFire, FaEye, FaArrowUp } from "react-icons/fa";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import FilterSidebar from "@/components/tutorials/FilterSidebar";

const tutorials = [
  {
    id: 1,
    title: "Mastering React.js",
    instructor: "John Doe",
    duration: "30 min",
    category: "React",
    level: "Beginner",
    rating: 4.8,
    views: 100,
    thumbnail: "https://codemanbd.com/wp-content/uploads/2024/03/Mastering-React-JS.jpg",
    trending: true,
    preview: "https://www.w3schools.com/html/mov_bbb.mp4",
    tags: ["Beginner Friendly", "Hands-on"]
  },
  {
    id: 2,
    title: "Node.js Full Stack",
    instructor: "Jane Smith",
    duration: "45 min",
    category: "Node.js",
    level: "Intermediate",
    rating: 4.2,
    views: 200,
    thumbnail: "https://i.ytimg.com/vi/YYmzj5DK_5s/hq720.jpg",
    tags: ["Full Stack"]
  },
  {
    id: 3,
    title: "Deep Learning Basics",
    instructor: "Alan Turing",
    duration: "1h 10m",
    category: "AI",
    level: "Advanced",
    rating: 5.0,
    views: 150,
    thumbnail: "https://i.ytimg.com/vi/bpFjQGCa7Xg/maxresdefault.jpg",
    trending: true,
    tags: ["Top Rated"]
  },
  {
    id: 4,
    title: "UI/UX Design Mastery",
    instructor: "Sarah Adams",
    duration: "50 min",
    category: "Design",
    level: "Intermediate",
    rating: 4.7,
    views: 180,
    thumbnail: "https://framerusercontent.com/assets/EKEOIDPjqN813mQCpOA23uDFcns.jpg",
    tags: ["Design"]
  },
  {
    id: 5,
    title: "Advanced JavaScript",
    instructor: "Elon Dev",
    duration: "40 min",
    category: "JavaScript",
    level: "Advanced",
    rating: 4.9,
    views: 220,
    thumbnail: "https://i.ytimg.com/vi/IljVmcDDrOg/maxresdefault.jpg",
    tags: ["Advanced"]
  },
  {
    id: 6,
    title: "Intro to TypeScript",
    instructor: "Clara Lee",
    duration: "35 min",
    category: "TypeScript",
    level: "Beginner",
    rating: 4.6,
    views: 175,
    thumbnail: "https://i.ytimg.com/vi/BCg4U1FzODs/maxresdefault.jpg",
    tags: ["Beginner Friendly"]
  },
  {
    id: 7,
    title: "Next.js Crash Course",
    instructor: "Mark Evans",
    duration: "1h 20m",
    category: "React",
    level: "Intermediate",
    rating: 4.9,
    views: 320,
    thumbnail: "https://i.ytimg.com/vi/1WmNXEVia8I/maxresdefault.jpg",
    trending: true,
    tags: ["Full Stack"]
  },
  {
    id: 8,
    title: "Responsive Web Design",
    instructor: "Laura Bennett",
    duration: "45 min",
    category: "Design",
    level: "Beginner",
    rating: 4.5,
    views: 250,
    thumbnail: "https://i.ytimg.com/vi/srvUrASNj0s/maxresdefault.jpg",
    tags: ["CSS", "HTML"]
  },
  {
    id: 9,
    title: "Python for Beginners",
    instructor: "Dr. Zainab",
    duration: "1h",
    category: "Python",
    level: "Beginner",
    rating: 4.3,
    views: 180,
    thumbnail: "https://i.ytimg.com/vi/_uQrJ0TkZlc/maxresdefault.jpg",
    tags: ["Beginner Friendly"]
  },
  {
    id: 10,
    title: "Docker Essentials",
    instructor: "Mohamed Ali",
    duration: "50 min",
    category: "DevOps",
    level: "Intermediate",
    rating: 4.4,
    views: 210,
    thumbnail: "https://i.ytimg.com/vi/Gjnup-PuquQ/maxresdefault.jpg",
    tags: ["Containers"]
  },
  {
    id: 11,
    title: "Git & GitHub Essentials",
    instructor: "Emily Davis",
    duration: "30 min",
    category: "Tools",
    level: "Beginner",
    rating: 4.7,
    views: 300,
    thumbnail: "https://i.ytimg.com/vi/apGV9Kg7ics/maxresdefault.jpg",
    tags: ["Git", "Version Control"]
  },
];


const TutorialsSection = () => {
  const [sortBy, setSortBy] = useState("default");
  const [visibleCount, setVisibleCount] = useState(6);
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const router = useRouter();
  const loader = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const sortedTutorials = [...tutorials]
    .filter(tut =>
      tut.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tut.instructor.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
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
            <FilterSidebar />
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
              {visibleTutorials.map((tut) => (
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
                    <h3 className="font-bold text-lg text-yellow-400 mb-1">{tut.title}</h3>
                    <p className="text-sm text-gray-300">Instructor: {tut.instructor}</p>

                    <div className="flex flex-wrap gap-2 mt-2 text-xs">
                      <span className="bg-yellow-500 text-black px-2 py-1 rounded-full font-semibold">{tut.level}</span>
                      {tut.tags?.map((tag, i) => (
                        <span key={i} className="bg-gray-700 px-2 py-1 rounded-full text-yellow-300">
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
                  </div>
                </motion.div>
              ))}
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