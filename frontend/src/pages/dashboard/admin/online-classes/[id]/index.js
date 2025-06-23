// pages/dashboard/admin/online-classes/[id]/index.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import Link from "next/link";
import { fetchAdminClassById } from "@/services/admin/classService";

export default function AdminClassDetailPage() {
  const { id } = useRouter().query;
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchAdminClassById(id);
        setDetails(data);
      } catch (err) {
        console.error("Failed to load class", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

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

      {loading ? (
        <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100 text-center">Loading...</div>
      ) : (
      <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100 space-y-6">
        {details?.cover_image && (
          <img
            src={details.cover_image}
            alt="Class Cover"
            className="w-full h-64 object-cover rounded-lg"
          />
        )}
        {details?.demo_video_url && (
          <video
            controls
            className="w-full mt-4 rounded-lg"
            src={details.demo_video_url}
          />
        )}

        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-yellow-600">{details?.title}</h2>
          <p className="text-gray-500 text-sm">Instructor: {details?.instructor}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 pt-4 text-sm">
          <div className="space-y-1">
            <p><strong>🗓️ Start Date:</strong> {details?.start_date}</p>
            <p><strong>🗖 End Date:</strong> {details?.end_date || '-'}</p>
            <p><strong>🏷️ Category:</strong> {details?.category || '-'}</p>
          </div>
          <div className="space-y-1">
            <p>
              <strong>📌 Status:</strong>{" "}
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                {details?.status}
              </span>
            </p>
            {details?.price && <p><strong>💵 Price:</strong> ${details.price}</p>}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">📘 Description</h3>
          <p className="text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{__html: details?.description}} />
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
      )}
    </div>
  );
}

AdminClassDetailPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};