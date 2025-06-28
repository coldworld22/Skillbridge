// pages/dashboard/admin/online-classes/[id]/index.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import Link from "next/link";
import { fetchAdminClassById } from "@/services/admin/classService";
import CustomVideoPlayer from "@/components/shared/CustomVideoPlayer";

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
    <div className="p-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Class Details</h1>
          <p className="text-gray-500 text-sm mt-1">ID: {id}</p>
        </div>
        <Link
          href="/dashboard/admin/online-classes"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to All Classes
        </Link>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-100 text-center">
          <div className="animate-pulse flex justify-center">
            <div className="h-8 w-8 bg-blue-200 rounded-full"></div>
          </div>
          <p className="mt-3 text-gray-600">Loading class details...</p>
        </div>
      ) : (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
        {/* Media section */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Cover image and video */}
          <div className="space-y-6">
            {details?.cover_image && (
              <img
                src={details.cover_image}
                alt="Class Cover"
                className="w-full h-64 md:h-80 object-cover rounded-lg shadow-sm"
              />
            )}
            
            {details?.demo_video_url && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-sm font-medium text-gray-700">Class Demo Video</h3>
                </div>
                <CustomVideoPlayer
                  videos={[{ src: encodeURI(details.demo_video_url) }]}
                />
              </div>
            )}
          </div>

          {/* Header with instructor */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {details?.instructor_image && (
              <div className="flex-shrink-0">
                <img
                  src={details.instructor_image}
                  alt={details.instructor}
                  className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                />
              </div>
            )}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{details?.title}</h2>
              <p className="text-gray-600 mt-1">
                <span className="font-medium">Instructor:</span> {details?.instructor}
              </p>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Start Date</p>
                  <p className="text-gray-800">{details?.start_date}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">End Date</p>
                  <p className="text-gray-800">{details?.end_date || '-'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Category</p>
                  <p className="text-gray-800">{details?.category || '-'}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    details?.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : details?.status === 'upcoming' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    {details?.status}
                  </span>
                </div>
              </div>
              
              {details?.price && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Price</p>
                    <p className="text-gray-800">${details.price}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Views</p>
                  <p className="text-gray-800">{details?.views ?? 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="pt-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">Description</h3>
            <div className="prose max-w-none text-gray-600" dangerouslySetInnerHTML={{__html: details?.description}} />
          </div>

          {/* Actions */}
          <div className="pt-6 flex flex-wrap gap-3">
            <Link
              href={`/dashboard/admin/online-classes/edit/${id}`}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Edit Class
            </Link>
            <Link
              href={`/dashboard/admin/online-classes/${id}/students`}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.025-3.5 4 4 0 011.025-3.5 4 4 0 011.766 3.001 4 4 0 013.234 3.001A6.969 6.969 0 0016 16c0 .34-.024.673-.07 1H12.93z" />
              </svg>
              View Students
            </Link>
            <Link
              href={`/dashboard/admin/online-classes/${id}/analytics`}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              View Analytics
            </Link>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

AdminClassDetailPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};