import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaSearch,
  FaCalendarAlt,
  FaBookOpen,
  FaVideo,
  FaHeart,
  FaThumbsUp,
} from "react-icons/fa";
import { useRouter } from "next/router";
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

// Initial category options include the special "Trending" filter
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

const OnlineClasses = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showLiveClasses, setShowLiveClasses] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const [classes, setClasses] = useState([]);
  const [categories, setCategories] = useState(initialCategories);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [likedIds, setLikedIds] = useState([]);
  const user = useAuthStore((state) => state.user);
  const isStudent = user?.role?.toLowerCase() === 'student';
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchPublishedClasses();
        const list = res?.data ?? [];
        const formatted = list.map((c) => ({
          ...c,
          status: computeStatus(c.start_date, c.end_date),
        }));
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
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!user || !isStudent) return;
    const load = async () => {
      try {
        const w = await getMyClassWishlist();
        setWishlistIds(w.map((c) => c.id));
        const l = await getMyLikedClasses();
        setLikedIds(l.map((c) => c.id));
      } catch (err) {
        console.error('Failed to load wishlist/likes', err);
      }
    };
    load();
  }, [user]);

  // Filter logic
  const filteredClasses = classes.filter(
    (classItem) =>
      (selectedCategory === "All" ||
        (selectedCategory === "Trending" && classItem.trending) ||
        classItem.category === selectedCategory) &&
      (showLiveClasses ? classItem.status === "Live" : true) &&
      classItem.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load more
  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 6);
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative w-full py-20 text-center bg-gradient-to-b from-gray-800 to-gray-900"
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2 className="text-5xl font-extrabold mb-6 text-yellow-500">
            🚀 Learn Anytime, Anywhere!
          </motion.h2>
          <motion.p className="text-lg text-gray-300 mb-8">
            Find expert-led courses and join live sessions. Choose from{" "}
            <span className="text-yellow-400 font-semibold">Trending, Free, or Best-Selling</span> classes today!
          </motion.p>

          {/* 🔍 Search & Filters */}
          <div className="flex flex-wrap justify-center items-center gap-4 mb-8">
            <div className="relative w-full max-w-lg">
              <input
                type="text"
                placeholder="Search for a class..."
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
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <button
              onClick={() => setShowLiveClasses(!showLiveClasses)}
              className={`p-3 rounded-lg shadow-lg transition ${
                showLiveClasses ? "bg-yellow-500 text-gray-900" : "bg-gray-800 text-white"
              }`}
            >
              {showLiveClasses ? "📹 Show All Classes" : "🎥 Show Only Live Classes"}
            </button>
          </div>

          {/* 📚 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredClasses.slice(0, visibleCount).map((classItem) => (
              <motion.div
                key={classItem.id}
                whileHover={{ scale: 1.03 }}
                className="bg-gray-800 p-6 rounded-2xl shadow-xl relative group hover:ring-2 hover:ring-yellow-400 transition-all"
              >
                <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                  <button
                    onClick={async () => {
                      if (!user) return router.push('/auth/login');
                      if (!isStudent) {
                        toast.error('Only students can like classes.');
                        return;
                      }
                      if (likedIds.includes(classItem.id)) {
                        await unlikeClass(classItem.id);
                        setLikedIds(likedIds.filter((i) => i !== classItem.id));
                      } else {
                        await likeClass(classItem.id);
                        setLikedIds([...likedIds, classItem.id]);
                      }
                    }}
                    className="bg-gray-700 bg-opacity-70 hover:bg-opacity-100 p-2 rounded-full"
                  >
                    <FaThumbsUp className={likedIds.includes(classItem.id) ? 'text-yellow-400' : 'text-gray-300'} />
                  </button>
                  <button
                    onClick={async () => {
                      if (!user) return router.push('/auth/login');
                      if (!isStudent) {
                        toast.error('Only students can save classes.');
                        return;
                      }
                      if (wishlistIds.includes(classItem.id)) {
                        await removeClassFromWishlist(classItem.id);
                        setWishlistIds(wishlistIds.filter((i) => i !== classItem.id));
                      } else {
                        await addClassToWishlist(classItem.id);
                        setWishlistIds([...wishlistIds, classItem.id]);
                      }
                    }}
                    className="bg-gray-700 bg-opacity-70 hover:bg-opacity-100 p-2 rounded-full"
                  >
                    <FaHeart className={wishlistIds.includes(classItem.id) ? 'text-yellow-400' : 'text-gray-300'} />
                  </button>
                </div>
                {/* Status and trending badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1">
                  {classItem.trending && (
                    <span className="bg-yellow-500 text-gray-900 px-3 py-1 text-xs font-bold rounded-full shadow-sm">
                      🔥 Trending
                    </span>
                  )}
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full ${
                      classItem.status === "Live"
                        ? "bg-red-500 text-white animate-pulse"
                        : classItem.status === "Completed"
                        ? "bg-gray-600 text-white"
                        : "bg-green-600 text-white"
                    }`}
                  >
                    {classItem.status}
                  </span>
                </div>

                {/* Icon */}
                {classItem.status === "Live" ? (
                  <FaVideo className="text-red-400 text-5xl mb-4 mx-auto" />
                ) : (
                  <FaBookOpen className="text-yellow-400 text-5xl mb-4 mx-auto" />
                )}

                <h3 className="text-xl font-bold mb-1 text-white">{classItem.title}</h3>
                <p className="text-sm text-gray-400">👨‍🏫 {classItem.instructor || ""}</p>
                <p className="text-sm text-gray-400 mt-1 flex items-center justify-center gap-2">
                  <FaCalendarAlt />
                  {classItem.start_date ? new Date(classItem.start_date).toLocaleDateString() : ""}
                </p>
                <p className="text-sm text-gray-500 italic mt-1">{classItem.category || ""}</p>

                <button
                  className="mt-4 bg-yellow-500 text-gray-900 font-semibold px-5 py-2 rounded-lg hover:bg-yellow-600 transition w-full"
                  onClick={() => router.push(`/online-classes/${classItem.id}`)}
                >
                  {classItem.status === "Live" ? "🎥 Join Live" : "📘 View Class"}
                </button>
              </motion.div>
            ))}
          </div>

          {/* 📊 Class Count */}
          <p className="mt-6 text-sm text-gray-400">
            Showing {Math.min(visibleCount, filteredClasses.length)} of {filteredClasses.length} classes
          </p>

          {/* 📍 Load More */}
          {visibleCount < filteredClasses.length && (
            <motion.button
              onClick={handleLoadMore}
              whileHover={{ scale: 1.05 }}
              className="mt-8 px-6 py-3 bg-yellow-500 text-gray-900 text-lg font-bold rounded-lg shadow-lg hover:bg-yellow-600 transition"
            >
              Load More
            </motion.button>
          )}
        </div>
      </motion.section>
    </div>
  );
};

export default OnlineClasses;
