import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import useAuthStore from "@/store/auth/authStore";
import StudentLayout from "@/components/layouts/StudentLayout";
import {
  Star,
  CheckCircle,
  UserCheck,
  MessageCircle,
  Clock,
} from "lucide-react";

import BookingRequestModal from "@/components/student/instructors/BookingRequestModal";

const mockInstructors = [
  {
    id: 1,
    name: "Dr. John Doe",
    expertise: "Data Science",
    experience: "10+ Years",
    rating: 4.9,
    bio: "Dr. John Doe has taught Data Science for over a decade, specializing in Python, machine learning, and data visualization.",
    avatar: "https://www.iwcf.org/wp-content/uploads/2018/12/Instructor-top-of-page-image-new.jpg",
    tags: ["Python", "Beginner Friendly", "ML", "Pandas"],
    verified: true,
    slots: ["10:00 AM", "2:00 PM", "5:00 PM"],
    reviews: [
      { name: "Alice", rating: 5, text: "Amazing instructor!" },
      { name: "Bob", rating: 4, text: "Very detailed and clear explanations." }
    ]
  },
  // Add other instructors...
];

export default function InstructorProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [instructor, setInstructor] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const { user } = useAuthStore();

  const openBooking = () => {
    if (!user || user.role?.toLowerCase() !== "student") {
      toast.info(
        "Please login as a student or create a student account to proceed."
      );
      router.push("/auth/login");
      return;
    }
    setShowBooking(true);
  };

  useEffect(() => {
    if (id) {
      const data = mockInstructors.find((ins) => ins.id === parseInt(id));
      setInstructor(data || null);
    }
  }, [id]);

  if (!instructor) return <p className="p-6">Loading instructor details...</p>;

  return (
    <StudentLayout>
      <section className="py-10 px-6 max-w-3xl mx-auto bg-white rounded-xl shadow">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center">
          <img src={instructor.avatar} className="w-32 h-32 rounded-full border-4 border-yellow-400 mb-4" />
          <h1 className="text-2xl font-bold">{instructor.name}</h1>
          <p className="text-gray-500">{instructor.expertise} · {instructor.experience}</p>
          <div className="mt-2 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <FaStar key={i} className={i < Math.floor(instructor.rating) ? "text-yellow-400" : "text-gray-300"} />
            ))}
            <span className="text-sm text-gray-600">({instructor.rating})</span>
            {instructor.verified && (
              <span className="ml-2 text-green-600 text-sm flex items-center gap-1">
                <FaCheckCircle  /> Verified
              </span>
            )}
          </div>
        </div>

        {/* Bio Section */}
        <div className="mt-6 text-left">
          <h2 className="text-lg font-semibold mb-2">About</h2>
          <p className="text-gray-700">{instructor.bio}</p>
        </div>

        {/* Tags */}
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Skills & Tags</h2>
          <div className="flex flex-wrap gap-2">
            {instructor.tags.map((tag, idx) => (
              <span key={idx} className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full">{tag}</span>
            ))}
          </div>
        </div>

        {/* Available Time Slots */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Available Time Slots</h2>
          <div className="flex flex-wrap gap-2">
            {instructor.slots.map((slot, i) => (
              <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-1">
                <FaClock /> {slot}
              </span>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Student Reviews</h2>
          <div className="space-y-3">
            {instructor.reviews.map((rev, i) => (
              <div key={i} className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{rev.name}</span>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <FaStar key={j} className={j < rev.rating ? "text-yellow-400" : "text-gray-300"} />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 mt-1 text-sm">{rev.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={openBooking}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded-lg flex items-center gap-2"
          >
            <FaUserCheck /> Book Lesson
          </button>
          <button
            onClick={() => router.push(`/website/pages/messages?userId=${instructor.id}`)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
          >
            <FaComments /> Chat Now
          </button>
        </div>

        {/* Booking Modal */}
        {showBooking && (
          <BookingRequestModal
            instructor={instructor}
            onClose={() => setShowBooking(false)}
          />
        )}
      </section>
    </StudentLayout>
  );
}
