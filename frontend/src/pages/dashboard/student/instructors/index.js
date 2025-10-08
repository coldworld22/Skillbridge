import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import StudentLayout from "@/components/layouts/StudentLayout";
import InstructorCard from "@/components/student/instructors/InstructorCard";
import InstructorFilters from "@/components/student/instructors/InstructorFilters";
import BookingRequestModal from "@/components/student/instructors/BookingRequestModal";
import ChatRedirectModal from "@/components/student/instructors/ChatRedirectModal";
import { fetchPublicInstructors } from "@/services/public/instructorService";

const sortOptions = ["Highest Rated", "Most Experienced"];

export default function StudentInstructorsAll() {
  const router = useRouter();
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [sortBy, setSortBy] = useState("Highest Rated");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const [bookingInstructor, setBookingInstructor] = useState(null);
  const [chatInstructorId, setChatInstructorId] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("favorites") || "[]");
    setFavorites(stored);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchPublicInstructors();
        const mapped = data.map((i) => ({
          id: i.id,
          name: i.full_name,
          expertise: Array.isArray(i.expertise)
            ? i.expertise.join(", ")
            : i.expertise,
          tags: Array.isArray(i.expertise) ? i.expertise : [],
          experience: i.experience || "",
          rating: i.rating || 0,
          avatar: i.avatar_url,
          availableNow: i.is_online,
          verified: false,
        }));
        setInstructors(mapped);
      } catch (err) {
        console.error("Failed to load instructors", err);
        setError("Failed to load instructors.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleFavorite = (id) => {
    const updated = favorites.includes(id)
      ? favorites.filter((fid) => fid !== id)
      : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };
  const categories = useMemo(
    () => ["All", ...new Set(instructors.flatMap((i) => i.tags))],
    [instructors]
  );

  const filtered = instructors
    .filter(
      (i) =>
        (!onlyAvailable || i.availableNow) &&
        (selectedCategory === "All" || i.tags.includes(selectedCategory)) &&
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

  return (
    <StudentLayout>
      <section className="py-10 px-4">
        <h1 className="text-2xl font-bold mb-6">Find Instructors</h1>

        <InstructorFilters
          categories={categories}
          sortOptions={sortOptions}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          sortBy={sortBy}
          setSortBy={setSortBy}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onlyAvailable={onlyAvailable}
          setOnlyAvailable={setOnlyAvailable}
        />

        {error && <p className="text-red-500 mb-4">{error}</p>}
        {loading ? (
          <p>Loading instructors...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((i) => (
              <InstructorCard
                key={i.id}
                instructor={i}
                isFavorite={favorites.includes(i.id)}
                onToggleFavorite={() => toggleFavorite(i.id)}
                onBook={() => setBookingInstructor(i)}
                onChat={() => setChatInstructorId(i.id)}
              />
            ))}
          </div>
        )}

        {/* Booking Confirmation Modal */}
        {bookingInstructor && (
          <BookingRequestModal
            instructor={bookingInstructor}
            onClose={() => setBookingInstructor(null)}
          />
        )}

        {/* Chat Confirmation Modal */}
        {chatInstructorId && (
          <ChatRedirectModal
            onCancel={() => setChatInstructorId(null)}
            onConfirm={() => {
              const target = chatInstructorId;
              setChatInstructorId(null);
              router.push(`/messages?userId=${target}`);
            }}
          />
        )}
      </section>
    </StudentLayout>
  );
}
