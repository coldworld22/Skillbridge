// pages/dashboard/admin/online-classes/[id]/index.js
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import Link from "next/link";

const mockClassDetails = {
  title: "React & Next.js Bootcamp",
  instructor: "Ayman Khalid",
  date: "2025-05-13",
  endDate: "2025-06-13",
  duration: "1 month",
  category: "Web Development",
  price: 49,
  status: "Upcoming",
  description: "This intensive bootcamp covers the essentials of React and Next.js, focusing on building modern web apps with real-world use cases.",
  studentsEnrolled: 42,
  maxCapacity: 50,
  image: "https://bs-uploads.toptal.io/blackfish-uploads/components/blog_post_page/5912616/cover_image/retina_1708x683/1015_Next.js_vs._React-_A_Comparative_Tutorial_Illustration_Brief_Blog-e14319490440a98149fbda"
};

export default function AdminClassDetailPage() {
  const { id } = useRouter().query;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">📄 Class Details (ID: {id})</h1>
        <Link
          href="/dashboard/admin/online-classes"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to All Classes
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100 space-y-6">
        <img
          src={mockClassDetails.image}
          alt="Class Cover"
          className="w-full h-64 object-cover rounded-lg"
        />

        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-yellow-600">{mockClassDetails.title}</h2>
          <p className="text-gray-500 text-sm">Instructor: {mockClassDetails.instructor}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 pt-4 text-sm">
          <div className="space-y-1">
            <p><strong>🗓️ Start Date:</strong> {mockClassDetails.date}</p>
            <p><strong>🗖 End Date:</strong> {mockClassDetails.endDate}</p>
            <p><strong>⏳ Duration:</strong> {mockClassDetails.duration}</p>
            <p><strong>🏷️ Category:</strong> {mockClassDetails.category}</p>
          </div>
          <div className="space-y-1">
            <p>
              <strong>📌 Status:</strong>{" "}
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                {mockClassDetails.status}
              </span>
            </p>
            <p><strong>💵 Price:</strong> ${mockClassDetails.price}</p>
            <p><strong>👥 Enrolled:</strong> {mockClassDetails.studentsEnrolled} / {mockClassDetails.maxCapacity}</p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">📘 Description</h3>
          <p className="text-gray-600 leading-relaxed">{mockClassDetails.description}</p>
        </div>

        <div className="pt-4 flex flex-wrap gap-4">
          <Link
            href={`/dashboard/admin/online-classes/edit/${id}`}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 text-sm"
          >
            ✏️ Edit
          </Link>
          <Link
            href={`/dashboard/admin/online-classes/${id}/students`}
            className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 text-sm"
          >
            🎓 View Students
          </Link>
          <Link
            href={`/dashboard/admin/online-classes/${id}/analytics`}
            className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 text-sm"
          >
            📊 Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}

AdminClassDetailPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};