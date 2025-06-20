// ✅ Enhanced Instructor Booking UI Component with All Features
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import useAuthStore from "@/store/auth/authStore";
import { fetchPublicInstructors } from "@/services/public/instructorService";
import BookingRequestModal from "@/components/student/instructors/BookingRequestModal";

import { motion } from "framer-motion";
import {
  FaChalkboardTeacher,
  FaStar,
  FaUserCheck,
  FaComments,
  FaHeart,
  FaCircleCheck,
} from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

const defaultCategories = ["All"];
const sortOptions = ["Highest Rated", "Most Experienced"];

export default function InstructorBooking() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [instructors, setInstructors] = useState([]);
  const [categories, setCategories] = useState(defaultCategories);

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
        const data = await fetchPublicInstructors();
        const mapped = data.map((ins) => ({
          ...ins,
          name: ins.full_name,
          avatar: ins.avatar_url
            ? `${API_BASE_URL}${ins.avatar_url}`
            : "/images/profile/user.png",
          rating: ins.rating || 5,
          tags: Array.isArray(ins.expertise) ? ins.expertise : [],
          availableNow: !!ins.is_online,
          verified: ins.status === "active",
        }));
        setInstructors(mapped);
        const cats = new Set(defaultCategories);
        mapped.forEach((ins) => {
          if (Array.isArray(ins.expertise)) {
            ins.expertise.forEach((e) => cats.add(e));
          } else if (ins.expertise) {
            cats.add(ins.expertise);
          }
        });
        setCategories(Array.from(cats));
      } catch (err) {
        console.error("Failed to load instructors", err);
      }
    };
    load();
  }, []);

  const filtered = instructors
    .filter(
      (i) =>
        (!onlyAvailable || i.availableNow) &&
        (!showFavoritesOnly || favorites.includes(i.id)) &&
        (selectedCategory === "All" ||
          (Array.isArray(i.expertise)
            ? i.expertise.includes(selectedCategory)
            : i.expertise === selectedCategory)) &&
        i.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "Highest Rated") return b.rating - a.rating;
      if (sortBy === "Most Experienced") {
        const getYears = (exp) => parseInt(exp);
        return getYears(b.experience) - getYears(a.experience);
      }
      return 0;
    });

  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const handleRequest = (instructor) => {
    if (!user || user.role?.toLowerCase() !== "student") {
      router.push("/auth/login");
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
      className="py-16 bg-gray-900 text-white text-center"
    >
      <h2 className="text-4xl font-bold mb-6 text-yellow-500">Book or Chat with Instructors</h2>
      <p className="text-lg text-gray-300 mb-8">Request tutorials or private lessons directly.</p>

      {/* Search & Filter */}
      <div className="flex flex-wrap justify-center items-center gap-4 mb-8">
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            placeholder="Search instructors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 pl-10 rounded-lg border border-gray-500 text-gray-900"
          />
          <FaSearch className="absolute left-3 top-4 text-gray-600" />
        </div>

        <select
          className="p-3 border border-gray-500 rounded-lg bg-gray-800 text-white"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          className="p-3 border border-gray-500 rounded-lg bg-gray-800 text-white"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          {sortOptions.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
          />
          Only Available Now
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={showFavoritesOnly}
            onChange={(e) => setShowFavoritesOnly(e.target.checked)}
          />
          Show Favorites Only
        </label>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {filtered.length === 0 ? (
          <p className="col-span-full text-gray-400">No instructors found.</p>
        ) : (
          filtered.map((i) => (
            <motion.div
            key={i.id}
            whileHover={{ scale: 1.05 }}
            className="p-6 bg-gray-800 rounded-lg shadow-lg text-center flex flex-col items-center relative"
          >
            {i.availableNow && (
              <span className="absolute top-2 right-2 bg-green-500 text-xs px-2 py-1 rounded-full">Online</span>
            )}
            {i.verified && (
              <span className="absolute top-2 left-2 text-green-400 text-sm flex items-center gap-1">
                <FaCircleCheck /> Verified
              </span>
            )}
            <img src={i.avatar} className="w-20 h-20 rounded-full border-2 border-yellow-500 mb-3" alt={i.name} />
            <h3 className="text-xl font-semibold cursor-pointer hover:underline" onClick={() => router.push(`/instructors/${i.id}`)}>{i.name}</h3>
            <p className="text-gray-300 text-sm">{i.expertise}</p>
            <p className="text-gray-400 text-sm">{i.experience}</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <FaStar
                  key={idx}
                  className={idx < Math.floor(i.rating) ? "text-yellow-400" : "text-gray-500"}
                />
              ))}
              <span className="text-sm text-gray-300">({i.rating})</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {i.tags.map((tag, idx) => (
                <span key={idx} className="bg-yellow-700 text-xs px-2 py-1 rounded-full text-white">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => handleRequest(i)}
                className="bg-yellow-500 text-black px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-600"
              >
                <FaUserCheck /> Request Lesson
              </button>
              <button
                onClick={() => setChatWithInstructor(i.id)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
              >
                <FaComments /> Chat
              </button>
              <button
                onClick={() => toggleFavorite(i.id)}
                className={`px-2 py-2 rounded-full hover:bg-yellow-700 transition ${favorites.includes(i.id) ? 'bg-yellow-500 text-black' : 'bg-gray-600 text-white'}`}
                aria-label="Save to Favorites"
              >
                <FaHeart />
              </button>
            </div>
            </motion.div>
          ))
        )}
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
            <h3 className="text-xl font-bold mb-3">Open Chat</h3>
            <p className="text-gray-300">Start chatting with this instructor now.</p>
            <button
              onClick={() => {
                setChatWithInstructor(null);
                router.push(`/website/pages/messages?userId=${chatWithInstructor}`);
              }}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
            >
              <FaComments /> Go to Chat
            </button>
          </motion.div>
        </div>
      )}
    </motion.section>
  );
}