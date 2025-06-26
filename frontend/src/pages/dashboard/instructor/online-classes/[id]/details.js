import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { fetchInstructorClassById } from "@/services/instructor/classService";
import CustomVideoPlayer from "@/components/shared/CustomVideoPlayer";

export default function InstructorClassDetailPage() {
  const { id } = useRouter().query;
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchInstructorClassById(id);
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
        <Link href="/dashboard/instructor/online-classes" className="text-sm text-blue-600 hover:underline">
          ← Back to My Classes
        </Link>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100 text-center">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100 space-y-6">
          {details?.cover_image && (
            <img src={details.cover_image} alt="Class Cover" className="w-full h-64 object-cover rounded-lg" />
          )}
          {details?.demo_video_url && (
            <div className="mt-4">
              <CustomVideoPlayer videos={[{ src: encodeURI(details.demo_video_url) }]} />
            </div>
          )}

          <div className="space-y-1 flex items-center gap-4">
            {details?.instructor_image && (
              <img
                src={details.instructor_image}
                alt={details.instructor}
                className="w-12 h-12 rounded-full object-cover"
              />
            )}
            <div>
              <h2 className="text-2xl font-semibold text-yellow-600">{details?.title}</h2>
              <p className="text-gray-500 text-sm">Instructor: {details?.instructor}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 pt-4 text-sm">
            <div className="space-y-1">
              <p><strong>🗓️ Start Date:</strong> {details?.start_date}</p>
              <p><strong>🗖 End Date:</strong> {details?.end_date || '-'}</p>
              <p><strong>🏷️ Category:</strong> {details?.category || '-'}</p>
            </div>
            <div className="space-y-1">
              <p>
                <strong>📌 Status:</strong>{' '}
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  {details?.status}
                </span>
              </p>
              {details?.price && <p><strong>💵 Price:</strong> ${details.price}</p>}
              <p><strong>👁️ Views:</strong> {details?.views ?? 0}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">📘 Description</h3>
            <p className="text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: details?.description }} />
          </div>

          <div className="pt-4 flex flex-wrap gap-4">
            <Link
              href={`/dashboard/instructor/online-classes/${id}`}
              className="bg-yellow-500 text-black px-4 py-2 rounded shadow hover:bg-yellow-600 text-sm"
            >
              🚀 Manage Class
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

InstructorClassDetailPage.getLayout = function getLayout(page) {
  return <InstructorLayout>{page}</InstructorLayout>;
};
