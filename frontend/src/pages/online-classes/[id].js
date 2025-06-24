// pages/online-classes/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';
import { FaFacebook, FaTwitter, FaWhatsapp } from 'react-icons/fa';
import { fetchClassDetails } from '@/services/classService';
import { API_BASE_URL } from '@/config/config';


export default function ClassDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const resolveUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    return `${API_BASE_URL}${path}`.replace(/(?<!:)\/\/+/, '/');
  };

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const details = await fetchClassDetails(id);
        setClassInfo(details?.data ?? details);
      } catch (err) {
        console.error('Failed to load class', err);
        setError('Failed to load class');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="text-white text-center mt-32">Loading...</div>;
  if (error) return <div className="text-red-400 text-center mt-32">{error}</div>;
  if (!classInfo) return <div className="text-red-400 text-center mt-32">Class not found</div>;

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const description = classInfo.description
    ? classInfo.description.replace(/<[^>]+>/g, '')
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-white font-sans">
      <Navbar />

      <main className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start gap-8 mb-10">
          <div className="flex-1">
            <h1 className="text-yellow-400 text-xl font-semibold uppercase tracking-wide mb-2">Featured Class</h1>
            <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-yellow-400 mb-4">
              {classInfo.title}
            </h2>
            <p className="text-sm text-gray-400">
              <span className="font-semibold text-white">Instructor:</span> {classInfo.instructor}
            </p>
            {(classInfo.instructorBio || classInfo.instructor_bio) && (
              <p className="italic mt-2 text-gray-400">
                {classInfo.instructorBio || classInfo.instructor_bio}
              </p>
            )}
          </div>
          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-yellow-400 shadow-md">
            <img
              src={resolveUrl(classInfo.instructor_image) || '/images/profile/user.png'}
              alt={classInfo.instructor}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {classInfo.demo_video_url ? (
          <video
            src={resolveUrl(classInfo.demo_video_url)}
            controls
            className="w-full rounded-xl shadow-2xl mb-10 max-h-[500px] object-cover border border-gray-800"
          />
        ) : (
          <img
            src={resolveUrl(classInfo.cover_image)}
            alt={classInfo.title}
            className="w-full rounded-xl shadow-2xl mb-10 max-h-[500px] object-cover border border-gray-800"
          />
        )}

        <p className="mb-8 text-lg leading-relaxed text-gray-300 text-justify">
          {description}
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12 text-sm text-gray-300">
          {classInfo.start_date && (
            <p><strong>Date:</strong> {new Date(classInfo.start_date).toLocaleDateString()}</p>
          )}
          {classInfo.duration && (
            <p><strong>Duration:</strong> {classInfo.duration}</p>
          )}
          <p><strong>Category:</strong> {classInfo.category}</p>
          {typeof classInfo.spots_left === 'number' && (
            <p><strong>Available Spots:</strong> {classInfo.spots_left}</p>
          )}
          <p><strong>Price:</strong> {classInfo.price === 0 ? 'Free' : `$${classInfo.price}`}</p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-2">What you'll learn</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            {classInfo.syllabus?.map((topic, index) => (
              <li key={index}>{topic}</li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 text-white">Student Reviews</h2>
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-3">
            <p className="text-yellow-400 font-bold text-lg">⭐⭐⭐⭐☆</p>
            <p className="text-sm text-gray-300">“Great content and well-paced lessons!” – Sarah M.</p>
            <p className="text-sm text-gray-300">“The live sessions helped a lot.” – Ahmed F.</p>
          </div>
        </section>

        <section className="mb-10 bg-gray-800 p-6 rounded-xl text-center sm:text-left shadow-2xl">
          <p className="text-xl font-semibold mb-2">Ready to join <strong>{classInfo.title}</strong>?</p>
          <p className="text-sm text-gray-400 mb-5">Click below to secure your seat and start learning!</p>
          <button
            onClick={() => router.push(`/payments/checkout?classId=${id}`)}
            disabled={typeof classInfo.spots_left === 'number' && classInfo.spots_left <= 0}
            className={`w-full sm:w-auto px-8 py-3 font-semibold rounded-full transition duration-300 shadow-lg ${
              typeof classInfo.spots_left === 'number' && classInfo.spots_left <= 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-yellow-500 text-gray-900 hover:bg-yellow-600'
            }`}
          >
            {typeof classInfo.spots_left === 'number' && classInfo.spots_left <= 0
              ? 'Class Full'
              : classInfo.price === 0
              ? 'Enroll for Free'
              : 'Proceed to Payment'}
          </button>
        </section>

        <div className="flex flex-wrap items-center gap-4 text-gray-300">
          <span className="font-medium">Share this class:</span>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noopener noreferrer" className="hover:text-white"><FaFacebook size={22} /></a>
          <a href={`https://twitter.com/intent/tweet?url=${shareUrl}`} target="_blank" rel="noopener noreferrer" className="hover:text-white"><FaTwitter size={22} /></a>
          <a href={`https://wa.me/?text=${shareUrl}`} target="_blank" rel="noopener noreferrer" className="hover:text-white"><FaWhatsapp size={22} /></a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
