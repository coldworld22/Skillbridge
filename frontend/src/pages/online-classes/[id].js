// pages/online-classes/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';
import CustomVideoPlayer from '@/components/shared/CustomVideoPlayer';
import { safeEncodeURI } from '@/utils/url';
import { FaFacebook, FaTwitter, FaWhatsapp, FaHeart, FaRegHeart, FaCalendarAlt, FaClock, FaTag, FaInfoCircle, FaUsers, FaDollarSign } from 'react-icons/fa';
import {
  enrollInClass,
  fetchClassDetails,
  fetchMyEnrolledClasses,
  addClassToWishlist,
  removeClassFromWishlist,
  getMyClassWishlist,
} from '@/services/classService';
import useCartStore from '@/store/cart/cartStore';
import useAuthStore from '@/store/auth/authStore';
import { toast } from 'react-toastify';
import ClassReviews from '@/components/online-classes/detail/ClassReviews';
import ClassComments from '@/components/online-classes/detail/ClassComments';

const computeScheduleStatus = (start, end) => {
  const now = new Date();
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;
  if (s && now < s) return 'Upcoming';
  if (s && e && now >= s && now <= e) return 'Ongoing';
  if (e && now > e) return 'Completed';
  return 'Upcoming';
};

const StatusBadge = ({ status }) => {
  const statusColors = {
    Upcoming: 'bg-blue-500',
    Ongoing: 'bg-green-500',
    Completed: 'bg-gray-500'
  };
  
  return (
    <span className={`${statusColors[status] || 'bg-gray-500'} text-white text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
      {status}
    </span>
  );
};

export default function ClassDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [inWishlist, setInWishlist] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const addItem = useCartStore((state) => state.addItem);

  const isGuest = !isAuthenticated();
  const isStudent = user?.role?.toLowerCase() === 'student';

  const handleGuestRedirect = () => {
    toast.info('Please log in or register to enroll.');
    router.push('/auth/login');
  };

  const handleRoleBlocked = () => {
    toast.error('Only students can enroll in classes.');
  };

  const handleAddToCart = async () => {
    if (isGuest) {
      handleGuestRedirect();
      return;
    }
    if (!isStudent) {
      handleRoleBlocked();
      return;
    }
    if (isEnrolled) {
      toast.info('You are already enrolled in this class');
      return;
    }

    try {
      await addItem({ id: classInfo.id, name: classInfo.title, price: classInfo.price });
      toast.success('Added to cart');
      router.push('/cart');
    } catch (err) {
      console.error('Failed to add to cart', err);
      toast.error('Failed to add to cart');
    }
  };

  const handleProceed = async () => {
    if (isGuest) {
      handleGuestRedirect();
      return;
    }
    if (!isStudent) {
      handleRoleBlocked();
      return;
    }
    if (isEnrolled) {
      toast.info('You are already enrolled in this class');
      return;
    }

    if (classInfo.price === 0) {
      try {
        await enrollInClass(classInfo.id);
        toast.success('Enrolled successfully');
        router.push(`/payments/success?classId=${classInfo.id}`);
      } catch (err) {
        console.error('Failed to enroll', err);
        toast.error('Failed to enroll');
      }
    } else {
      router.push(`/payments/checkout?classId=${classInfo.id}`);
    }
  };

  const handleToggleWishlist = async () => {
    if (isGuest) {
      handleGuestRedirect();
      return;
    }
    if (!isStudent) {
      handleRoleBlocked();
      return;
    }

    try {
      if (inWishlist) {
        await removeClassFromWishlist(classInfo.id);
        setInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await addClassToWishlist(classInfo.id);
        setInWishlist(true);
        toast.success('Added to wishlist');
      }
    } catch (err) {
      console.error('Wishlist update failed', err);
      toast.error('Failed to update wishlist');
    }
  };

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const details = await fetchClassDetails(id);
        setClassInfo(details?.data ?? details);
        if (isAuthenticated()) {
          const enrolled = await fetchMyEnrolledClasses();
          const record = enrolled.find((c) => String(c.id) === String(id));
          if (record) {
            setIsEnrolled(true);
            setEnrollmentStatus(record.status);
          } else {
            setIsEnrolled(false);
            setEnrollmentStatus(null);
          }
          const wishlist = await getMyClassWishlist();
          setInWishlist(wishlist.some((c) => String(c.id) === String(id)));
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

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 bg-yellow-400 rounded-full mb-4"></div>
        <div className="h-4 w-32 bg-gray-700 rounded"></div>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center">
      <div className="text-red-400 text-center p-8 bg-gray-800 rounded-xl shadow-lg">
        {error}
      </div>
    </div>
  );
  
  if (!classInfo) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center">
      <div className="text-red-400 text-center p-8 bg-gray-800 rounded-xl shadow-lg">
        Class not found
      </div>
    </div>
  );

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const plainDescription = classInfo.description
    ? classInfo.description.replace(/<[^>]*>/g, '')
    : '';
  const classFull =
    typeof classInfo.spots_left === 'number' && classInfo.spots_left <= 0;
  const scheduleStatus = computeScheduleStatus(
    classInfo.start_date,
    classInfo.end_date,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-white font-sans">
      <Navbar />

      <main className="max-w-6xl mx-auto pt-[88px] pb-8 px-4 sm:px-6 lg:px-20">

        {/* Class Header Section */}
        <div className="mb-10 bg-gray-800/50 rounded-xl p-6 shadow-lg border border-gray-700">
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex-shrink-0">
              <img
                src={classInfo.cover_image}
                alt={classInfo.title}
                className="w-24 h-24 md:w-32 md:h-32 rounded-xl object-cover border-2 border-yellow-400 shadow-md"
              />
            </div>
            <div className="flex-grow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <span className="inline-block bg-yellow-400/20 text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full mb-2">
                    Featured Class
                  </span>
                  <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                    {classInfo.title}
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-yellow-400">
                    {classInfo.price === 0 ? 'Free' : `$${classInfo.price}`}
                  </span>
                  <button
                    onClick={handleToggleWishlist}
                    className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                    aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    {inWishlist ? (
                      <FaHeart className="text-yellow-400 text-xl" />
                    ) : (
                      <FaRegHeart className="text-gray-300 text-xl hover:text-yellow-400" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-4">
                <img
                  src={classInfo.instructor_image}
                  alt={classInfo.instructor}
                  className="w-12 h-12 rounded-full object-cover border-2 border-yellow-400"
                />
                <div>
                  <p className="text-sm text-gray-300">
                    <span className="font-medium text-white">Instructor:</span>{' '}
                    <a 
                      href={`/instructors/${classInfo.instructor_id}`} 
                      className="hover:text-yellow-400 transition-colors"
                    >
                      {classInfo.instructor}
                    </a>
                  </p>
                  {classInfo.instructorBio && (
                    <p className="text-xs text-gray-400 mt-1">{classInfo.instructorBio}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video/Image Preview Section */}
        <div className="mb-10 rounded-xl overflow-hidden shadow-2xl border border-gray-700">
          {classInfo.demo_video_url ? (
            <CustomVideoPlayer
              videos={[{ src: safeEncodeURI(classInfo.demo_video_url) }]}
              className="w-full"
            />
          ) : (
            <img
              src={classInfo.cover_image}
              alt={classInfo.title}
              className="w-full h-auto max-h-[500px] object-cover"
            />
          )}
        </div>

        {/* Class Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex items-center gap-3">
            <div className="bg-yellow-400/20 p-2 rounded-full">
              <FaCalendarAlt className="text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Start Date</p>
              <p className="font-medium">
                {classInfo.start_date ? new Date(classInfo.start_date).toLocaleDateString() : 'TBD'}
              </p>
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex items-center gap-3">
            <div className="bg-yellow-400/20 p-2 rounded-full">
              <FaClock className="text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Duration</p>
              <p className="font-medium">{classInfo.duration || 'Flexible'}</p>
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex items-center gap-3">
            <div className="bg-yellow-400/20 p-2 rounded-full">
              <FaUsers className="text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Available Spots</p>
              <p className="font-medium">
                {typeof classInfo.spots_left === 'number' ? (
                  classInfo.spots_left > 0 ? (
                    `${classInfo.spots_left} left`
                  ) : (
                    <span className="text-red-400">Class Full</span>
                  )
                ) : 'Unlimited'}
              </p>
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex items-center gap-3">
            <div className="bg-yellow-400/20 p-2 rounded-full">
              <FaInfoCircle className="text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Status</p>
              <p className="font-medium flex items-center gap-2">
                <StatusBadge status={scheduleStatus} />
              </p>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-4 text-yellow-400 border-b border-gray-700 pb-2">About This Class</h2>
          <p className="text-gray-300 leading-relaxed whitespace-pre-line">
            {plainDescription}
          </p>
        </div>

        {/* Reviews Section */}
        <ClassReviews classId={id} canReview={isEnrolled} />

        {/* Comments Section */}
        <ClassComments classId={id} canComment={isEnrolled} />

        {/* Enrollment CTA Section */}
        <section className="mb-10 bg-gradient-to-r from-gray-800 to-gray-800/50 p-8 rounded-xl border border-gray-700 shadow-xl">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              {isEnrolled ? 'You\'re Enrolled!' : 'Ready to Join?'}
            </h2>
            <p className="text-gray-300 mb-6">
              {isEnrolled 
                ? 'Access your class materials and start learning now!'
                : 'Secure your spot and start your learning journey today.'}
            </p>
            
            {isAuthenticated() && isStudent && (
              <p className="text-sm text-gray-400 mb-6">
                <strong>Enrollment Status:</strong>{' '}
                <span className={enrollmentStatus === 'active' ? 'text-green-400' : 'text-yellow-400'}>
                  {enrollmentStatus || 'Not Enrolled'}
                </span>
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isEnrolled ? (
                <button
                  onClick={() => router.push(`/dashboard/student/online-classe/${classInfo.id}`)}
                  className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Go to Class Dashboard
                </button>
              ) : (
                <>
                  {isGuest || !isStudent ? (
                    <>
                      <button
                        onClick={isGuest ? handleGuestRedirect : handleRoleBlocked}
                        className="px-6 py-3 bg-gray-700 text-gray-300 font-medium rounded-lg cursor-not-allowed"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={isGuest ? handleGuestRedirect : handleRoleBlocked}
                        className="px-6 py-3 bg-gray-700 text-gray-300 font-medium rounded-lg cursor-not-allowed"
                      >
                        {classInfo.price === 0 ? 'Enroll for Free' : 'Proceed to Payment'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleAddToCart}
                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors duration-300"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={handleProceed}
                        disabled={classFull}
                        className={`px-8 py-3 font-bold rounded-lg transition-all duration-300 ${
                          classFull
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 hover:shadow-lg'
                        }`}
                      >
                        {classFull
                          ? 'Class Full'
                          : classInfo.price === 0
                          ? 'Enroll for Free'
                          : 'Proceed to Payment'}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* Share Section */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-gray-300 mb-10">
          <span className="font-medium text-lg">Share this class:</span>
          <div className="flex gap-4">
            <a 
              href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-blue-400 transition-colors p-2 bg-gray-800 rounded-full"
              aria-label="Share on Facebook"
            >
              <FaFacebook size={20} />
            </a>
            <a 
              href={`https://twitter.com/intent/tweet?url=${shareUrl}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-blue-400 transition-colors p-2 bg-gray-800 rounded-full"
              aria-label="Share on Twitter"
            >
              <FaTwitter size={20} />
            </a>
            <a 
              href={`https://wa.me/?text=${shareUrl}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-green-400 transition-colors p-2 bg-gray-800 rounded-full"
              aria-label="Share on WhatsApp"
            >
              <FaWhatsapp size={20} />
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}