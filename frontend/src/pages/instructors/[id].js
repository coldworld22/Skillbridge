import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import useAuthStore from "@/store/auth/authStore";
import StudentLayout from "@/components/layouts/StudentLayout";
import AdminLayout from "@/components/layouts/AdminLayout";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { FaUserCheck, FaComments, FaStar, FaChalkboardTeacher, FaVideo, FaCalendarAlt } from "react-icons/fa";
import { IoMdTime } from "react-icons/io";
import BookingRequestModal from "@/components/student/instructors/BookingRequestModal";
import { fetchPublicInstructorById } from "@/services/public/instructorService";
import { fetchPublishedClasses } from "@/services/classService";
import { fetchPublishedTutorials } from "@/services/tutorialService";
import CustomVideoPlayer from "@/components/shared/CustomVideoPlayer";

export default function InstructorProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [instructor, setInstructor] = useState(null);
  const [stats, setStats] = useState({ classes: 0, tutorials: 0 });
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const { user } = useAuthStore();

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

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
        const formatted = {
          ...data,
          avatar_url: data?.avatar_url
            ? `${API_BASE_URL}${data.avatar_url}`
            : "/images/profile/user.png",
          demo_video_url: data?.demo_video_url
            ? `${API_BASE_URL}${data.demo_video_url}`
            : null,
        };
        setInstructor(formatted);

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

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
    </div>
  );
  
  if (!instructor) return (
    <div className="text-center py-10">
      <h2 className="text-xl font-semibold text-gray-700">Instructor not found</h2>
      <p className="text-gray-500 mt-2">The requested instructor profile does not exist</p>
    </div>
  );

  const joinDate = instructor.created_at
    ? new Date(instructor.created_at).toLocaleDateString()
    : null;

  const role = user?.role?.toLowerCase();
  let Layout = StudentLayout;
  if (role === "instructor") {
    Layout = InstructorLayout;
  } else if (role === "admin" || role === "superadmin") {
    Layout = AdminLayout;
  }

  return (
    <Layout>
      <section className="py-8 px-4 sm:px-6 max-w-4xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header with background */}
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-32 relative">
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
              <div className="relative">
                <img
                  src={instructor.avatar_url}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                  alt={instructor.full_name}
                />
                <span
                  className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-white ${
                    instructor.is_online ? "bg-green-500" : "bg-gray-400"
                  }`}
                ></span>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="pt-20 pb-6 px-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">{instructor.full_name}</h1>
              <p className="text-yellow-600 font-medium">
                {instructor.expertise} {instructor.experience ? `· ${instructor.experience}` : ""}
              </p>
              
              {/* Stats */}
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center text-gray-600">
                  <FaChalkboardTeacher className="mr-2 text-yellow-500" />
                  <span>{stats.classes} Classes</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FaVideo className="mr-2 text-yellow-500" />
                  <span>{stats.tutorials} Tutorials</span>
                </div>
                {joinDate && (
                  <div className="flex items-center text-gray-600">
                    <IoMdTime className="mr-2 text-yellow-500" />
                    <span>Joined {joinDate}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-4"></div>

            {/* About Section */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">About Me</h2>
              {instructor.bio ? (
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {instructor.bio}
                </p>
              ) : (
                <p className="text-gray-400 italic">No bio provided</p>
              )}
            </div>

            {/* Contact & Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {instructor.email && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                  <p className="text-gray-800">{instructor.email}</p>
                </div>
              )}
              
              {instructor.phone && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Phone</h3>
                  <p className="text-gray-800">{instructor.phone}</p>
                </div>
              )}
              
              {instructor.pricing && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Pricing</h3>
                  <p className="text-gray-800">{instructor.pricing}</p>
                </div>
              )}
            </div>

            {/* Demo Video */}
            {instructor.demo_video_url && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Demo Video</h2>
                <div className="rounded-lg overflow-hidden shadow-md">
                  <CustomVideoPlayer videos={[{ src: encodeURI(instructor.demo_video_url) }]} />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
              <button
                onClick={openBooking}
                className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
              >
                <FaCalendarAlt /> Book Lesson
              </button>
              <button
                onClick={() => router.push(`/website/pages/messages?userId=${instructor.id}`)}
                className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
              >
                <FaComments /> Chat Now
              </button>
            </div>
          </div>
        </div>

        {/* Booking Modal */}
        {showBooking && (
          <BookingRequestModal
            instructor={instructor}
            onClose={() => setShowBooking(false)}
          />
        )}
      </section>
    </Layout>
  );
}