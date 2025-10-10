// pages/online-classes/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState, useMemo } from 'react';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';
import CustomVideoPlayer from '@/components/shared/CustomVideoPlayer';
import { FaFacebook, FaTwitter, FaWhatsapp, FaHeart, FaRegHeart, FaCalendarAlt, FaClock, FaInfoCircle, FaUsers, FaStar } from 'react-icons/fa';
import {
  enrollInClass,
  fetchClassDetails,
  fetchMyEnrolledClasses,
  addClassToWishlist,
  removeClassFromWishlist,
  getMyClassWishlist,
  fetchClassReviews,
} from '@/services/classService';
import useCartStore from '@/store/cart/cartStore';
import useAuthStore from '@/store/auth/authStore';
import useSubscriptionStore from '@/store/subscriptionStore';
import { toast } from 'react-toastify';
import { useTranslation } from 'next-i18next';
import ClassReviews from '@/components/online-classes/detail/ClassReviews';
import ClassComments from '@/components/online-classes/detail/ClassComments';
import { formatCurrency } from '@/utils/currency';

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
  const { t } = useTranslation(['website', 'tutorials']);
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [inWishlist, setInWishlist] = useState(false);
  const [instructorRating, setInstructorRating] = useState(null);
  const { user, isAuthenticated } = useAuthStore();
  const addItem = useCartStore((state) => state.addItem);
  const subscriptionPlan = useSubscriptionStore((state) => state.plan);
  const subscriptionLoading = useSubscriptionStore((state) => state.loading);
  const fetchSubscription = useSubscriptionStore((state) => state.fetch);

  const isGuest = !isAuthenticated();
  const isStudent = user?.role?.toLowerCase() === 'student';

  const handleGuestRedirect = () => {
    toast.info(t('login_or_register_to_enroll'));
    router.push('/auth/login');
  };

  const handleRoleBlocked = () => {
    toast.error(t('only_students_enroll'));
  };

  const handleViewPlans = () => {
    router.push('/website/student-plans');
  };

  const handleAddToCart = async () => {
    if (!classInfo) return;
    if (isGuest) {
      handleGuestRedirect();
      return;
    }
    if (!isStudent) {
      handleRoleBlocked();
      return;
    }
    if (isEnrolled) {
      toast.info(t('already_enrolled_class'));
      return;
    }
    if (requiresPlanOnly) {
      toast.info(t('plan_required_to_enroll'));
      return;
    }
    if (hasPlanCoverage && isPlanCovered) {
      toast.info(t('plan_included_you_are_covered'));
      return;
    }

    try {
      await addItem({ id: classInfo.id, name: classInfo.title, price: classInfo.price });
      toast.success(t('added_to_cart'));
      router.push(`/payments/checkout?itemId=${classInfo.id}&itemType=class`);
    } catch (err) {
      console.error('Failed to add to cart', err);
      toast.error(t('failed_to_add_to_cart'));
    }
  };

  const handleProceed = async () => {
    if (!classInfo) return;
    if (isGuest) {
      handleGuestRedirect();
      return;
    }
    if (!isStudent) {
      handleRoleBlocked();
      return;
    }
    if (isEnrolled) {
      toast.info(t('already_enrolled_class'));
      return;
    }

    if (requiresPlanOnly && !isPlanCovered) {
      toast.error(t('plan_required_to_enroll'));
      return;
    }

    const needsPayment =
      classInfo.access_type !== 'free' &&
      hasNumericPrice &&
      !isPlanCovered;

    if (!needsPayment) {
      try {
        await enrollInClass(classInfo.id);
        toast.success(
          isPlanCovered ? t('plan_enrolled_success') : t('tutorials:enroll_success')
        );
        router.push(`/payments/success?classId=${classInfo.id}`);
      } catch (err) {
        console.error('Failed to enroll', err);
        if (err.response?.status === 403) {
          toast.error(t('plan_required_to_enroll'));
        } else {
          toast.error(t('failed_to_enroll'));
        }
      }
    } else {
      router.push(`/payments/checkout?itemId=${classInfo.id}&itemType=class`);
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
        toast.success(t('removed_from_wishlist'));
      } else {
        await addClassToWishlist(classInfo.id);
        setInWishlist(true);
        toast.success(t('added_to_wishlist'));
      }
    } catch (err) {
      console.error('Wishlist update failed', err);
      toast.error(t('failed_to_update_wishlist'));
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
        const revs = await fetchClassReviews(id);
        if (revs.length) {
          const avg =
            revs.reduce((sum, r) => sum + (r.rating || 0), 0) / revs.length;
          setInstructorRating(avg);
        } else {
          setInstructorRating(null);
        }
        if (isAuthenticated()) {
          const enrolled = await fetchMyEnrolledClasses();
          const record = enrolled.find((c) => String(c.id) === String(id));
          if (record) {
            setIsEnrolled(true);
            setEnrollmentStatus(record.enrollmentStatus);
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

  useEffect(() => {
    if (!user || !isStudent) return;
    if (!subscriptionPlan && !subscriptionLoading) {
      fetchSubscription();
    }
  }, [user, isStudent, subscriptionPlan, subscriptionLoading, fetchSubscription]);

  const includedPlanIds = useMemo(
    () =>
      Array.isArray(classInfo?.included_plans)
        ? classInfo.included_plans.map((plan) => String(plan))
        : [],
    [classInfo]
  );
  const hasPlanCoverage = includedPlanIds.length > 0;
  const activePlanId = subscriptionPlan?.plan_id
    ? String(subscriptionPlan.plan_id)
    : null;
  const isPlanCovered = Boolean(
    activePlanId && includedPlanIds.includes(activePlanId)
  );
  const requiresPlanOnly = classInfo?.access_type === 'free';
  const currencyCode = classInfo?.currency || classInfo?.currency_code;
  const numericPrice = Number(classInfo?.price ?? 0);
  const hasNumericPrice = Number.isFinite(numericPrice) && numericPrice > 0;
  const priceLabel = requiresPlanOnly
    ? t('plan_members_only')
    : hasNumericPrice
    ? formatCurrency(numericPrice, currencyCode ? { currency: currencyCode } : undefined)
    : t('free');
  const planStatusMessage = hasPlanCoverage
    ? requiresPlanOnly
      ? isPlanCovered
        ? t('plan_included_you_are_covered')
        : t('plan_required_to_join')
      : isPlanCovered
      ? t('plan_included_you_are_covered')
      : t('plan_optional_hint')
    : null;
  const planRequiredNotCovered = requiresPlanOnly && !isPlanCovered;
  const allowAddToCart = classInfo?.access_type !== 'free' && !isPlanCovered;

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

  const isBrowser = typeof window !== 'undefined';
  const shareUrl = isBrowser ? window.location.href : '';
  const canShareNative = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else if (isBrowser) {
        const tempInput = document.createElement('input');
        tempInput.value = shareUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
      toast.success(t('link_copied'));
    } catch (err) {
      console.error('Failed to copy link', err);
      toast.error(t('share_failed'));
    }
  };

  const handleNativeShare = async () => {
    if (!canShareNative || !shareUrl) {
      handleCopyLink();
      return;
    }
    try {
      await navigator.share({
        title: classInfo?.title || 'Skillbridge Class',
        url: shareUrl,
      });
    } catch (err) {
      if (err?.name !== 'AbortError') {
        console.error('Native share failed', err);
        toast.error(t('share_failed'));
      }
    }
  };
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

      <div className="max-w-6xl mx-auto pt-2 px-4 sm:px-6 lg:px-20">
        <button
          onClick={() => router.back()}
          className="text-yellow-400 hover:underline text-sm"
        >
          &larr; Back to Classes
        </button>
      </div>

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
                    {priceLabel}
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
                {planStatusMessage && (
                  <p
                    className={`text-xs mt-1 ${
                      isPlanCovered ? 'text-green-300' : 'text-yellow-200'
                    }`}
                  >
                    {planStatusMessage}
                  </p>
                )}
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
                    <p className="text-xs text-gray-400 mt-1">
                      Experience: {classInfo.instructorBio} years
                    </p>
                  )}
                  {instructorRating !== null && (
                    <div className="flex items-center text-yellow-400 text-xs mt-1">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <FaStar
                          key={idx}
                          className={idx < Math.round(instructorRating) ? '' : 'text-gray-500'}
                        />
                      ))}
                      <span className="ml-1 text-gray-300">{instructorRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video/Image Preview Section */}
        <div className="mb-10 rounded-xl overflow-hidden shadow-2xl border border-gray-700 bg-black aspect-video">
        {classInfo.demo_video_url ? (
          <CustomVideoPlayer
            videos={[{ src: classInfo.demo_video_url }]}
            className="w-full h-full"
            videoClassName="h-full object-cover"
            storageKey={`online-class-${classInfo.id}`}
          />
        ) : (
          <img
            src={classInfo.cover_image}
            alt={classInfo.title}
            className="w-full h-full object-cover"
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

        <section className="space-y-10 mb-10">
          <ClassReviews classId={id} canReview={isEnrolled} />
          <ClassComments classId={id} canComment={isEnrolled} />
          <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-yellow-400 mb-1">
                  {t('share_class_heading')}
                </h3>
                <p className="text-sm text-gray-300">
                  {t('share_class_intro')}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-yellow-500 text-gray-900 font-semibold rounded-lg hover:bg-yellow-400 transition"
                >
                  {t('copy_link')}
                </button>
                {canShareNative && (
                  <button
                    onClick={handleNativeShare}
                    className="px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition"
                  >
                    {t('share_native')}
                  </button>
                )}
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-gray-300">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-full hover:bg-gray-700 transition"
                aria-label={t('share_facebook')}
              >
                <FaFacebook size={18} />
                <span className="text-sm font-medium">Facebook</span>
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-full hover:bg-gray-700 transition"
                aria-label={t('share_twitter')}
              >
                <FaTwitter size={18} />
                <span className="text-sm font-medium">Twitter/X</span>
              </a>
              <a
                href={`https://wa.me/?text=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-full hover:bg-gray-700 transition"
                aria-label={t('share_whatsapp')}
              >
                <FaWhatsapp size={18} />
                <span className="text-sm font-medium">WhatsApp</span>
              </a>
            </div>
          </div>
        </section>

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

            {!isEnrolled && isStudent && (
              <>
                {planRequiredNotCovered ? (
                  <p className="text-sm text-yellow-200 mb-4">
                    {t('plan_required_to_join')}
                  </p>
                ) : (
                  isPlanCovered && (
                    <p className="text-sm text-green-300 mb-4">
                      {t('plan_included_you_are_covered')}
                    </p>
                  )
                )}
              </>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isEnrolled ? (
                <button
                  onClick={() => router.push(`/dashboard/student/online-classes/${classInfo.id}`)}
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
                        {planRequiredNotCovered
                          ? t('plan_members_only')
                          : hasNumericPrice
                          ? 'Proceed to Payment'
                          : 'Enroll for Free'}
                      </button>
                    </>
                  ) : (
                    <>
                      {planRequiredNotCovered ? (
                        <>
                          <button
                            onClick={handleViewPlans}
                            className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 font-bold rounded-lg transition-all duration-300 hover:shadow-lg"
                          >
                            {t('plan_view_plans')}
                          </button>
                          <button
                            disabled
                            className="px-6 py-3 bg-gray-700 text-gray-400 font-medium rounded-lg cursor-not-allowed"
                          >
                            {t('plan_members_only')}
                          </button>
                        </>
                      ) : (
                        <>
                          {allowAddToCart && (
                            <button
                              onClick={handleAddToCart}
                              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors duration-300"
                            >
                              Add to Cart
                            </button>
                          )}
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
                              : isPlanCovered
                              ? t('join_with_plan')
                              : hasNumericPrice
                              ? 'Proceed to Payment'
                              : 'Enroll for Free'}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
