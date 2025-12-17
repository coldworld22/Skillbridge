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
  formatClass,
} from '@/services/classService';
import useCartStore from '@/store/cart/cartStore';
import useAuthStore from '@/store/auth/authStore';
import useSubscriptionStore from '@/store/subscriptionStore';
import { toast } from 'react-toastify';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ClassReviews from '@/components/online-classes/detail/ClassReviews';
import ClassComments from '@/components/online-classes/detail/ClassComments';
import { formatCurrency } from '@/utils/currency';
import { resolveApiBase } from '@/utils/serverApi';
import nextI18NextConfig from '../../../next-i18next.config.js';
import styles from '@/components/online-classes/onlineClasses.module.scss';

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
    Upcoming: styles.statusUpcoming,
    Ongoing: styles.statusOngoing,
    Completed: styles.statusCompleted
  };
  
  return (
    <span className={`${styles.badge} ${statusColors[status] || styles.statusCompleted}`}>
      {status}
    </span>
  );
};

export default function ClassDetailsPage({ initialClass = null, initialReviews = [] }) {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation(['website', 'tutorials']);
  const initialAverageRating =
    Array.isArray(initialReviews) && initialReviews.length
      ? initialReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / initialReviews.length
      : null;
  const [classInfo, setClassInfo] = useState(initialClass || null);
  const [loading, setLoading] = useState(!initialClass);
  const [error, setError] = useState(null);

  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [inWishlist, setInWishlist] = useState(false);
  const [instructorRating, setInstructorRating] = useState(initialAverageRating);
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

  useEffect(() => {
    if (initialClass) {
      setClassInfo(initialClass);
      setLoading(false);
    }
  }, [initialClass]);

  useEffect(() => {
    setInstructorRating(
      initialAverageRating !== null && !Number.isNaN(initialAverageRating)
        ? initialAverageRating
        : null
    );
  }, [initialAverageRating]);

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
    let cancelled = false;

    const matchesInitial =
      initialClass && String(initialClass.id) === String(id);

    if (matchesInitial) {
      setError(null);
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const details = await fetchClassDetails(id);
        if (cancelled) return;
        setClassInfo(details?.data ?? details);
        const revs = await fetchClassReviews(id);
        if (cancelled) return;
        if (revs.length) {
          const avg =
            revs.reduce((sum, r) => sum + (r.rating || 0), 0) / revs.length;
          setInstructorRating(avg);
        } else {
          setInstructorRating(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load class', err);
          setError('Failed to load class');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();

    return () => {
      cancelled = true;
    };
  }, [id, initialClass]);

  useEffect(() => {
    if (!id || !isAuthenticated()) return;
    let cancelled = false;
    const loadPersonalized = async () => {
      try {
        const enrolled = await fetchMyEnrolledClasses();
        if (!cancelled) {
          const record = enrolled.find((c) => String(c.id) === String(id));
          if (record) {
            setIsEnrolled(true);
            setEnrollmentStatus(record.enrollmentStatus);
          } else {
            setIsEnrolled(false);
            setEnrollmentStatus(null);
          }
        }
        const wishlist = await getMyClassWishlist();
        if (!cancelled) {
          setInWishlist(wishlist.some((c) => String(c.id) === String(id)));
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load wishlist/enrolled classes', err);
        }
      }
    };
    loadPersonalized();
    return () => {
      cancelled = true;
    };
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

  if (loading) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={`${styles.detailShell} ${styles.centerState}`}>
          <div className={styles.spinner} aria-label="Loading class" />
        </div>
        <Footer />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={`${styles.detailShell} ${styles.centerState}`}>
          <div className={styles.reviewCard}>
            <p className={styles.sectionBody}>{error}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  if (!classInfo) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={`${styles.detailShell} ${styles.centerState}`}>
          <div className={styles.reviewCard}>
            <p className={styles.sectionBody}>Class not found</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

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
    <div className={styles.page}>
      <Navbar />
      <div className={styles.detailShell}>
        <button
          onClick={() => router.back()}
          className={styles.backLink}
        >
          &larr; Back to Classes
        </button>

        <main className={styles.section}>
          <div className={styles.detailHeader}>
            <div className={styles.headerGrid}>
              <img
                src={classInfo.cover_image}
                alt={classInfo.title}
                className={styles.cover}
              />
              <div className={styles.titleWrap}>
                <span className={styles.pill}>Featured Class</span>
                <h1 className={styles.detailTitle}>{classInfo.title}</h1>
                <div className={styles.priceRow}>
                  <span className={styles.priceTag}>{priceLabel}</span>
                  <button
                    onClick={handleToggleWishlist}
                    className={styles.wishlistButton}
                    aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    {inWishlist ? <FaHeart /> : <FaRegHeart />}
                  </button>
                </div>
                {planStatusMessage && (
                  <p className={styles.muted}>
                    <span className={isPlanCovered ? styles.pillSuccess : styles.pillWarn}>
                      {planStatusMessage}
                    </span>
                  </p>
                )}

                <div className={styles.instructorRow}>
                  <img
                    src={classInfo.instructor_image}
                    alt={classInfo.instructor}
                    className={styles.avatar}
                  />
                  <div>
                    <p className={styles.muted}>
                      <span className={styles.instructorName}>Instructor:</span>{' '}
                      <a href={`/instructors/${classInfo.instructor_id}`} className={styles.backLink}>
                        {classInfo.instructor}
                      </a>
                    </p>
                    {classInfo.instructorBio && (
                      <p className={styles.muted}>
                        Experience: {classInfo.instructorBio} years
                      </p>
                    )}
                    {instructorRating !== null && (
                      <div className={styles.ratingRow}>
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <FaStar
                            key={idx}
                            color={idx < Math.round(instructorRating) ? '#fbbf24' : '#475569'}
                          />
                        ))}
                        <span className={styles.muted}>{instructorRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.detailHeader} style={{ padding: 0, overflow: 'hidden' }}>
            {classInfo.demo_video_url ? (
              <CustomVideoPlayer
                videos={[{ src: classInfo.demo_video_url }]}
                className={styles.cardImage}
                videoClassName={styles.cardImage}
                storageKey={`online-class-${classInfo.id}`}
              />
            ) : (
              <img
                src={classInfo.cover_image}
                alt={classInfo.title}
                className={styles.cardImage}
              />
            )}
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <FaCalendarAlt />
              </div>
              <div>
                <p className={styles.infoLabel}>Start Date</p>
                <p className={styles.infoValue}>
                  {classInfo.start_date ? new Date(classInfo.start_date).toLocaleDateString() : 'TBD'}
                </p>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <FaClock />
              </div>
              <div>
                <p className={styles.infoLabel}>Duration</p>
                <p className={styles.infoValue}>{classInfo.duration || 'Flexible'}</p>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <FaUsers />
              </div>
              <div>
                <p className={styles.infoLabel}>Available Spots</p>
                <p className={styles.infoValue}>
                  {typeof classInfo.spots_left === 'number'
                    ? classInfo.spots_left > 0
                      ? `${classInfo.spots_left} left`
                      : <span className={styles.pillWarn}>Class Full</span>
                    : 'Unlimited'}
                </p>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <FaInfoCircle />
              </div>
              <div>
                <p className={styles.infoLabel}>Status</p>
                <p className={styles.infoValue}>
                  <StatusBadge status={scheduleStatus} />
                </p>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>About This Class</h2>
            <p className={styles.sectionBody}>{plainDescription}</p>
          </div>

          <section className={styles.section}>
            <ClassReviews classId={id} canReview={isEnrolled} />
            <ClassComments classId={id} canComment={isEnrolled} />
            <div className={styles.shareCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>{t('share_class_heading')}</h3>
                  <p className={styles.muted}>{t('share_class_intro')}</p>
                </div>
                <div className={styles.shareActions}>
                  <button onClick={handleCopyLink} className={styles.primaryButton}>
                    {t('copy_link')}
                  </button>
                  {canShareNative && (
                    <button onClick={handleNativeShare} className={styles.secondaryButton}>
                      {t('share_native')}
                    </button>
                  )}
                </div>
              </div>
              <div className={styles.shareLinks}>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.shareLink}
                  aria-label={t('share_facebook')}
                >
                  <FaFacebook size={18} />
                  <span>Facebook</span>
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${shareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.shareLink}
                  aria-label={t('share_twitter')}
                >
                  <FaTwitter size={18} />
                  <span>Twitter/X</span>
                </a>
                <a
                  href={`https://wa.me/?text=${shareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.shareLink}
                  aria-label={t('share_whatsapp')}
                >
                  <FaWhatsapp size={18} />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </section>

          <section className={styles.ctaSection}>
            <h2 className={styles.ctaTitle}>
              {isEnrolled ? 'You\'re Enrolled!' : 'Ready to Join?'}
            </h2>
            <p className={styles.ctaText}>
              {isEnrolled
                ? 'Access your class materials and start learning now!'
                : 'Secure your spot and start your learning journey today.'}
            </p>

            {isAuthenticated() && isStudent && (
              <p className={styles.ctaNote}>
                <strong>Enrollment Status:</strong>{' '}
                <span className={enrollmentStatus === 'active' ? styles.pillSuccess : styles.pillWarn}>
                  {enrollmentStatus || 'Not Enrolled'}
                </span>
              </p>
            )}

            {!isEnrolled && isStudent && (
              <>
                {planRequiredNotCovered ? (
                  <p className={styles.pillWarn}>
                    {t('plan_required_to_join')}
                  </p>
                ) : (
                  isPlanCovered && (
                    <p className={styles.pillSuccess}>
                      {t('plan_included_you_are_covered')}
                    </p>
                  )
                )}
              </>
            )}

            <div className={styles.ctaButtons}>
              {isEnrolled ? (
                <button
                  onClick={() => router.push(`/dashboard/student/online-classes/${classInfo.id}`)}
                  className={styles.primaryButton}
                >
                  Go to Class Dashboard
                </button>
              ) : (
                <>
                  {isGuest || !isStudent ? (
                    <>
                      <button
                        onClick={isGuest ? handleGuestRedirect : handleRoleBlocked}
                        className={styles.secondaryButton}
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={isGuest ? handleGuestRedirect : handleRoleBlocked}
                        className={styles.secondaryButton}
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
                            className={styles.primaryButton}
                          >
                            {t('plan_view_plans')}
                          </button>
                          <button
                            disabled
                            className={`${styles.secondaryButton} ${styles.ctaDisabled}`}
                          >
                            {t('plan_members_only')}
                          </button>
                        </>
                      ) : (
                        <>
                          {allowAddToCart && (
                            <button
                              onClick={handleAddToCart}
                              className={styles.secondaryButton}
                            >
                              Add to Cart
                            </button>
                          )}
                          <button
                            onClick={handleProceed}
                            disabled={classFull}
                            className={`${styles.primaryButton} ${classFull ? styles.ctaDisabled : ''}`}
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
          </section>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export async function getServerSideProps({ locale, params }) {
  const apiBase = resolveApiBase(false).replace(/\/$/, '');
  const { id } = params || {};
  let initialClass = null;
  let initialReviews = [];

  if (id) {
    try {
      const classRes = await fetch(`${apiBase}/users/classes/${id}`, {
        headers: { Accept: 'application/json' },
      });
      if (classRes.ok) {
        const classJson = await classRes.json();
        const raw = classJson?.data ?? classJson ?? null;
        if (raw) {
          initialClass = formatClass(raw);
        }
      } else if (classRes.status === 404) {
        return { notFound: true };
      }

      const reviewsRes = await fetch(`${apiBase}/users/classes/reviews/${id}`, {
        headers: { Accept: 'application/json' },
      });
      if (reviewsRes.ok) {
        const reviewsJson = await reviewsRes.json();
        const reviews = reviewsJson?.data ?? reviewsJson ?? [];
        if (Array.isArray(reviews)) {
          initialReviews = reviews;
        }
      }
    } catch (err) {
      console.warn(`Failed to preload class ${id} for SEO`, err);
    }
  }

  if (!initialClass) {
    return { notFound: true };
  }

  return {
    props: {
      initialClass,
      initialReviews,
      ...(await serverSideTranslations(
        locale,
        ['common', 'website', 'tutorials'],
        nextI18NextConfig,
      )),
    },
  };
}
