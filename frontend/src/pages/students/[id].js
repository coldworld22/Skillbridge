import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import useAuthStore from "@/store/auth/authStore";
import StudentLayout from "@/components/layouts/StudentLayout";
import AdminLayout from "@/components/layouts/AdminLayout";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { FaComments } from "react-icons/fa";
import { IoMdTime } from "react-icons/io";
import { fetchPublicStudentById } from "@/services/public/studentService";

export default function PublicStudentProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  // Default to a relative path so the page works on any domain
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchPublicStudentById(id);
        const formatted = {
          ...data,
          avatar_url: data?.avatar_url
            ? `${API_BASE_URL}${data.avatar_url}`
            : "/images/profile/user.png",
        };
        setStudent(formatted);
      } catch (err) {
        console.error("Failed to load student", err);
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

  if (!student) return (
    <div className="text-center py-10">
      <h2 className="text-xl font-semibold text-gray-700">Student not found</h2>
      <p className="text-gray-500 mt-2">The requested student profile does not exist</p>
    </div>
  );

  const joinDate = student.created_at
    ? new Date(student.created_at).toLocaleDateString()
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
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-32 relative">
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
              <img
                src={student.avatar_url}
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                alt={student.full_name}
              />
            </div>
          </div>
          <div className="pt-20 pb-6 px-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">{student.full_name}</h1>
              {joinDate && (
                <div className="flex items-center justify-center mt-2 text-gray-600">
                  <IoMdTime className="mr-2 text-yellow-500" />
                  <span>Joined {joinDate}</span>
                </div>
              )}
            </div>
            <div className="border-t border-gray-200 my-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {student.email && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                  <p className="text-gray-800">{student.email}</p>
                </div>
              )}
              {student.phone && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Phone</h3>
                  <p className="text-gray-800">{student.phone}</p>
                </div>
              )}
              {student.education_level && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Education Level</h3>
                  <p className="text-gray-800">{student.education_level}</p>
                </div>
              )}
            </div>
            {Array.isArray(student.topics) && student.topics.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Topics of Interest</h2>
                <div className="flex flex-wrap gap-2">
                  {student.topics.map((topic, idx) => (
                    <span
                      key={idx}
                      className="inline-block bg-yellow-100 text-yellow-800 text-sm font-semibold px-3 py-1 rounded-full"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {student.learning_goals && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Learning Goals</h2>
                <p className="text-gray-600 whitespace-pre-line">{student.learning_goals}</p>
              </div>
            )}
            <div className="flex justify-center mt-8">
              <button
                onClick={() => router.push(`/messages?userId=${student.id}`)}
                className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
              >
                <FaComments /> Chat Now
              </button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
