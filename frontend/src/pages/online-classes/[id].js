// pages/online-classes/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';
import { FaFacebook, FaTwitter, FaWhatsapp } from 'react-icons/fa';
import { fetchClassDetails, fetchMyEnrolledClasses } from '@/services/classService';
import { addToCart } from '@/services/cartService';
import useAuthStore from '@/store/auth/authStore';
import { toast } from 'react-toastify';


export default function ClassDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  const handleAddToCart = async () => {
    if (!isAuthenticated()) {
      toast.info('Please login or create an account to proceed');
      router.push('/auth/login');
      return;
    }
    if (user.role?.toLowerCase() !== 'student') {
      toast.error('You must use a student account to enroll');
      router.push('/auth/login');
      return;
    }
    if (enrolled) {
      toast.info('You are already enrolled in this class');
      return;
    }
    try {
      await addToCart({ id: classInfo.id, name: classInfo.title, price: classInfo.price });
      toast.success('Added to cart');
      router.push('/cart');
    } catch (err) {
      console.error('Failed to add to cart', err);
      toast.error('Failed to add to cart');
    }
  };

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const details = await fetchClassDetails(id);
        const info = details?.data ?? details;
        setClassInfo(info);
        if (isAuthenticated()) {
          try {
            const my = await fetchMyEnrolledClasses();
            setEnrolled(my.some((c) => c.id === info.id));
          } catch (e) {
            console.error('Failed to check enrollment', e);
          }
        } else {
          setEnrolled(false);
        }
      } catch (err) {
        console.error('Failed to load class', err);
        setError('Failed to load class');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isAuthenticated]);

  if (loading) return <div className="text-white text-center mt-32">Loading...</div>;
  if (error) return <div className="text-red-400 text-center mt-32">{error}</div>;
  if (!classInfo) return <div className="text-red-400 text-center mt-32">Class not found</div>;

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const plainDescription = classInfo.description
    ? classInfo.description.replace(/<[^>]*>/g, '')
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-white font-sans">
      <Navbar />

      <main className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-6">
            <img
              src={classInfo.cover_image}
              alt={classInfo.title}
              className="w-20 h-20 rounded-full object-cover border-2 border-yellow-400"
            />
            <div>
              <h1 className="text-yellow-400 text-xl font-semibold uppercase tracking-wide">
                Featured Class
              </h1>
              <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-yellow-400">
                {classInfo.title}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <img
              src={classInfo.instructor_image}
              alt={classInfo.instructor}
              className="w-16 h-16 rounded-full object-cover border-2 border-yellow-400"
            />
            <div>
              <p className="text-sm text-gray-400">
                <span className="font-semibold text-white">Instructor:</span>{" "}
                <a href={`/instructors/${classInfo.instructor_id}`} className="hover:underline">
                  {classInfo.instructor}
                </a>
              </p>
              {classInfo.instructorBio && (
                <p className="italic mt-1 text-gray-400">{classInfo.instructorBio}</p>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Note: Classes on SkillBridge may be created by instructors or administrators.
          </p>

          {classInfo.instructor && (
            <p className="text-xs text-gray-500">Created by: {classInfo.instructor}</p>
          )}

        </div>

        {classInfo.demo_video_url ? (
          <video
            src={classInfo.demo_video_url}
            controls
            className="w-full rounded-xl shadow-2xl mb-10 max-h-[500px] object-cover border border-gray-800"
          />
        ) : (
          <img
            src={classInfo.cover_image}
            alt={classInfo.title}
            className="w-full rounded-xl shadow-2xl mb-10 max-h-[500px] object-cover border border-gray-800"
          />
        )}

        <p className="mb-8 text-lg leading-relaxed text-gray-300 text-justify">
          {plainDescription}
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
            onClick={handleAddToCart}
            disabled={
              enrolled ||
              (typeof classInfo.spots_left === 'number' && classInfo.spots_left <= 0)
            }
            className={`w-full sm:w-auto px-8 py-3 font-semibold rounded-full transition duration-300 shadow-lg ${
              typeof classInfo.spots_left === 'number' && classInfo.spots_left <= 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-yellow-500 text-gray-900 hover:bg-yellow-600'
            }`}
          >
            {enrolled
              ? 'Already Enrolled'
              : typeof classInfo.spots_left === 'number' && classInfo.spots_left <= 0
              ? 'Class Full'
              : classInfo.price === 0
              ? 'Enroll for Free'
              : 'Add to Cart'}
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
