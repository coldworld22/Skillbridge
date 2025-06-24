import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import useAuthStore from "@/store/auth/authStore";
import StudentLayout from "@/components/layouts/StudentLayout";
import { FaUserCheck, FaComments } from "react-icons/fa";
import BookingRequestModal from "@/components/student/instructors/BookingRequestModal";
import { fetchPublicInstructorById } from "@/services/public/instructorService";
import { fetchPublishedClasses } from "@/services/classService";
import { fetchPublishedTutorials } from "@/services/tutorialService";

export default function InstructorProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [instructor, setInstructor] = useState(null);
  const [stats, setStats] = useState({ classes: 0, tutorials: 0 });
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const { user } = useAuthStore();

  const openBooking = () => {
    if (!user || user.role?.toLowerCase() !== "student") {
      toast.info(
        "Please login as a student or create a student account to proceed."
      );

      return;
    }
    setShowBooking(true);
  };

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchPublicInstructorById(id);
        setInstructor(data);

        const classRes = await fetchPublishedClasses();
        const classList = classRes?.data ?? classRes ?? [];
        const classCount = classList.filter(
          (c) => String(c.instructor_id) === String(id)
        ).length;

        const tutRes = await fetchPublishedTutorials();
        const tutList = tutRes?.data ?? tutRes ?? [];
        const tutCount = tutList.filter(
          (t) => String(t.creator_id) === String(id)
        ).length;

        setStats({ classes: classCount, tutorials: tutCount });
      } catch (err) {
        console.error("Failed to load instructor", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <p className="p-6">Loading instructor details...</p>;
  if (!instructor) return <p className="p-6">Instructor not found.</p>;


  const joinDate = instructor.created_at
    ? new Date(instructor.created_at).toLocaleDateString()
    : null;


  return (
    <StudentLayout>
      <section className="py-10 px-6 max-w-3xl mx-auto bg-white rounded-xl shadow">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center">
          <img
            src={instructor.avatar_url}
            className="w-32 h-32 rounded-full border-4 border-yellow-400 mb-4"
          />
          <h1 className="text-2xl font-bold">{instructor.full_name}</h1>
          <p className="text-gray-500">
            {instructor.expertise} {instructor.experience ? `· ${instructor.experience}` : ""}
          </p>
          <div className="mt-2 text-sm text-gray-600">
            Classes taught: {stats.classes} · Tutorials: {stats.tutorials}
          </div>
        </div>

        {/* About */}
        <div className="mt-6 text-left">
          <h2 className="text-lg font-semibold mb-2">About</h2>
          <p className="text-gray-700">
            {instructor.expertise} {instructor.experience ? `· ${instructor.experience}` : ""}
          </p>
          {instructor.pricing && (
            <p className="text-gray-700 mt-2">Pricing: {instructor.pricing}</p>
          )}

          {joinDate && (
            <p className="text-gray-700 mt-2">Joined: {joinDate}</p>
          )}
          {instructor.email && (
            <p className="text-gray-700 mt-2">Email: {instructor.email}</p>
          )}
          {instructor.phone && (
            <p className="text-gray-700 mt-2">Phone: {instructor.phone}</p>
          )}

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
