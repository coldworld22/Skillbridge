// pages/dashboard/student/instructors/favorites.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import StudentLayout from "@/components/layouts/StudentLayout";
import InstructorCard from "@/components/student/instructors/InstructorCard";

const allInstructors = [
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

export default function StudentFavorites() {
  const router = useRouter();
  const [favorites, setFavorites] = useState([]);
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

  const favoriteInstructors = allInstructors.filter((i) => favorites.includes(i.id));

  return (
    <StudentLayout>
      <section className="py-10 px-4">
        <h1 className="text-2xl font-bold mb-6">My Favorite Instructors</h1>

        {favoriteInstructors.length === 0 ? (
          <p className="text-gray-600 text-center">You haven’t favorited any instructors yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteInstructors.map((i) => (
              <InstructorCard
                key={i.id}
                instructor={i}
                isFavorite={favorites.includes(i.id)}
                onToggleFavorite={() => toggleFavorite(i.id)}
                onBook={() => setBookingInstructor(i.name)}
                onChat={() => setChatInstructorId(i.id)}
              />
            ))}
          </div>
        )}
      </section>
    </StudentLayout>
  );
}
