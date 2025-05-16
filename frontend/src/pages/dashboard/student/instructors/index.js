import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import StudentLayout from "@/components/layouts/StudentLayout";
import InstructorCard from "@/components/student/instructors/InstructorCard";
import InstructorFilters from "@/components/student/instructors/InstructorFilters";
import BookingRequestModal from "@/components/student/instructors/BookingRequestModal";
import ChatRedirectModal from "@/components/student/instructors/ChatRedirectModal";

const instructors = [
  {
    id: 1,
    name: "Dr. John Doe",
    expertise: "Data Science",
    experience: "10+ Years",
    rating: 4.9,
    avatar: "https://www.iwcf.org/wp-content/uploads/2018/12/Instructor-top-of-page-image-new.jpg",
    tags: ["Beginner Friendly", "Python"],
    availableNow: true,
    verified: true,
  },
  {
    id: 2,
    name: "Jane Smith",
    expertise: "Web Development",
    experience: "8 Years",
    rating: 4.7,
    avatar: "https://media.istockphoto.com/id/1468138682/photo/happy-elementary-teacher-in-front-of-his-students-in-the-classroom.jpg",
    tags: ["JavaScript", "React"],
    availableNow: false,
    verified: false,
  },
];

const categories = ["All", "Data Science", "Web Development"];
const sortOptions = ["Highest Rated", "Most Experienced"];

export default function StudentInstructorsAll() {
  const router = useRouter();
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

  const toggleFavorite = (id) => {
    const updated = favorites.includes(id)
      ? favorites.filter((fid) => fid !== id)
      : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  const filtered = instructors
    .filter(
      (i) =>
        (!onlyAvailable || i.availableNow) &&
        (selectedCategory === "All" || i.expertise === selectedCategory) &&
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
              router.push(`/website/pages/messages?userId=${target}`);
            }}
          />
        )}
      </section>
    </StudentLayout>
  );
}
