// pages/payments/success.js
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';
import { FaCheckCircle, FaArrowRight, FaCalendarAlt, FaChalkboardTeacher, FaDownload, FaRegFilePdf } from 'react-icons/fa';
import { enrollInClass, fetchClassDetails } from '@/services/classService';
import { fetchBook } from '@/services/bookService';
import { enrollInTutorial, fetchTutorialDetails } from '@/services/tutorialService';
import { fetchPlanDetails } from '@/services/public/planService';
import { fetchMyPayments } from '@/services/student/paymentService';
import {
  fetchInvoiceByPaymentId as fetchStudentInvoiceByPaymentId,
  downloadInvoice as downloadStudentInvoice,
} from '@/services/student/invoiceService';
import {
  fetchInvoiceByPaymentId as fetchInstructorInvoiceByPaymentId,
  downloadInvoice as downloadInstructorInvoice,
} from '@/services/instructor/invoiceService';
import { subscribeToPlan, fetchMySubscription } from '@/services/subscriptionService';
import useCartStore from '@/store/cart/cartStore';
import { toast } from 'react-toastify';
import useLibraryStore from '@/store/libraryStore';
import { useTranslation } from 'next-i18next';
import useSubscriptionStore from '@/store/subscriptionStore';
import useAuthStore from '@/store/auth/authStore';
import { recordGoogleAdsConversion } from '@/utils/googleAds';

const normalizeRole = (value) => {
  if (!value) return null;
  const str = String(value).trim().toLowerCase();
  if (!str) return null;
  if (str.includes('instructor')) return 'instructor';
  if (str.includes('student')) return 'student';
  return str;
};

const parseNumericValue = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.,-]+/g, '').replace(',', '.');
    if (!cleaned) return undefined;
    const num = Number(cleaned);
    return Number.isNaN(num) ? undefined : num;
  }
  return undefined;
};

const pickFirstDefined = (...values) => {
  for (const val of values) {
    if (val === undefined || val === null) continue;
    if (typeof val === 'string') {
      if (val.trim() !== '') return val;
    } else {
      return val;
    }
  }
  return undefined;
};

export default function PaymentSuccessPage() {
  const router = useRouter();
  const {
    itemType: queryItemType,
    itemId: queryItemId,
    payment_id: queryPaymentId,
  } = router.query;
  const { t } = useTranslation('common');
  const [itemInfo, setItemInfo] = useState(null);
  const [invoiceInfo, setInvoiceInfo] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [subscriptionError, setSubscriptionError] = useState(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [bannerMessage, setBannerMessage] = useState(null);
  const [pendingPaymentFallback, setPendingPaymentFallback] = useState(null);
  const [planRole, setPlanRole] = useState(null);
  const removeItem = useCartStore((state) => state.removeItem);
  const { fetchLibrary } = useLibraryStore();
  const fetchSubscription = useSubscriptionStore((state) => state.fetch);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const userRole = useAuthStore((state) => state.user?.role);
  const normalizedUserRole = useMemo(() => normalizeRole(userRole), [userRole]);
  const conversionTrackedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.sessionStorage.getItem('pendingPayPalPayment');
      if (!raw) {
        setPendingPaymentFallback(null);
        return;
      }
      const parsed = JSON.parse(raw);
      setPendingPaymentFallback(parsed);
      if (queryPaymentId || queryItemId || queryItemType) {
        window.sessionStorage.removeItem('pendingPayPalPayment');
      }
    } catch (_err) {
      setPendingPaymentFallback(null);
    }
  }, [queryPaymentId, queryItemId, queryItemType]);

  const itemType = queryItemType || pendingPaymentFallback?.itemType || null;
  const itemId = queryItemId || pendingPaymentFallback?.itemId || null;
  const payment_id = queryPaymentId || pendingPaymentFallback?.paymentId || null;

  const confirmPlanSubscription = useCallback(async () => {
    if (payment_id && paymentInfo?.status !== 'paid') return;
    try {
      const sub = await fetchMySubscription();
      let current = Array.isArray(sub) ? sub[0] : sub;
      const isActiveSamePlan =
        current &&
        String(current.plan_id) === String(itemId) &&
        current.status === 'active';

      if (!isActiveSamePlan) {
        const { subscription, message } = await subscribeToPlan(
          itemId,
          undefined,
          payment_id
        );
        if (message) setBannerMessage(message);
        current = subscription;
      }

      setSubscriptionInfo(current);
      setSubscriptionError(null);
      await fetchSubscription();
      if (typeof refreshUser === 'function') {
        try {
          await refreshUser();
        } catch (err) {
          console.warn('Failed to refresh user after subscription', err);
        }
      }
    } catch (_) {
      setSubscriptionError('Failed to activate subscription');
    }
  }, [fetchSubscription, itemId, paymentInfo?.status, payment_id, refreshUser]);

  const loadData = useCallback(async () => {
    if (!itemType || !itemId) {
      await fetchLibrary();
      setPlanRole(null);
      setLoading(false);
      return;
    }

    setFetchError(null);

    let payment = null;
    let detectedPlanRole = null;

    try {
      if (itemType === 'class') {
        setPlanRole(null);
        if (!payment_id) {
          try {
            await enrollInClass(itemId);
            await removeItem(itemId);
          } catch (_) {
            toast.error('Failed to register for class');
          }
        }
        try {
          const details = await fetchClassDetails(itemId);
          setItemInfo(details?.data ?? details);
        } catch (_) {
          setItemInfo(null);
        }
      } else if (itemType === 'book') {
        setPlanRole(null);
        try {
          const details = await fetchBook(itemId);
          setItemInfo(details?.data ?? details);
        } catch (_) {
          setItemInfo(null);
        }
      } else if (itemType === 'tutorial') {
        setPlanRole(null);
        if (!payment_id) {
          try {
            await enrollInTutorial(itemId);
          } catch (_) {
            toast.error('Failed to enroll in tutorial');
          }
        }
        try {
          const details = await fetchTutorialDetails(itemId);
          setItemInfo(details?.data ?? details);
        } catch (_) {
          setItemInfo(null);
        }
      } else if (itemType === 'plan') {
        try {
          const details = await fetchPlanDetails(itemId);
          const data = details?.data ?? details;
          detectedPlanRole =
            normalizeRole(data?.target_role) ||
            normalizeRole(data?.role) ||
            normalizeRole(data?.slug) ||
            normalizeRole(pendingPaymentFallback?.role);
          setPlanRole(detectedPlanRole);
          setItemInfo({ ...data, title: data.name });
        } catch (_) {
          setItemInfo(null);
          setPlanRole(null);
        }
      } else {
        setPlanRole(null);
      }

      if (payment_id) {
        try {
          const paymentsPromise = fetchMyPayments();
          const invoiceRole =
            itemType === 'plan'
              ? normalizeRole(detectedPlanRole) ||
                normalizeRole(pendingPaymentFallback?.role) ||
                normalizedUserRole
              : 'student';
          const invoicePromise =
            itemType === 'plan' && invoiceRole === 'instructor'
              ? fetchInstructorInvoiceByPaymentId(payment_id)
              : fetchStudentInvoiceByPaymentId(payment_id);

          const [payments, invoice] = await Promise.all([
            paymentsPromise,
            invoicePromise,
          ]);
          payment = payments.find(
            (p) => String(p.id) === String(payment_id)
          );
          setPaymentInfo(payment || null);
          setInvoiceInfo(invoice);
        } catch (_) {
          setFetchError('Failed to load payment details');
        }
      } else {
        setPaymentInfo(null);
        setInvoiceInfo(null);
      }

      if (
        itemType === 'plan' &&
        (!payment_id || payment?.status === 'paid')
      ) {
        await confirmPlanSubscription();
      }
    } finally {
      if (
        typeof window !== 'undefined' &&
        pendingPaymentFallback &&
        !queryPaymentId &&
        !queryItemId &&
        !queryItemType
      ) {
        try {
          window.sessionStorage.removeItem('pendingPayPalPayment');
        } catch (_err) {
          // Ignore storage cleanup failures
        }
      }
      await fetchLibrary();
      setLoading(false);
    }
  }, [
    fetchLibrary,
    itemId,
    itemType,
    payment_id,
    pendingPaymentFallback,
    queryItemId,
    queryItemType,
    queryPaymentId,
    removeItem,
    confirmPlanSubscription,
    normalizedUserRole,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resolvedPlanRole = useMemo(() => {
    if (itemType !== 'plan') return null;
    const candidates = [
      normalizeRole(planRole),
      normalizeRole(subscriptionInfo?.role),
      normalizeRole(itemInfo?.target_role),
      normalizeRole(itemInfo?.role),
      normalizeRole(pendingPaymentFallback?.role),
      normalizedUserRole,
    ];
    return candidates.find(Boolean) || null;
  }, [
    itemType,
    planRole,
    subscriptionInfo?.role,
    itemInfo?.target_role,
    itemInfo?.role,
    pendingPaymentFallback,
    normalizedUserRole,
  ]);

  useEffect(() => {
    if (conversionTrackedRef.current) return;
    if (loading) return;
    if (!itemType && !paymentInfo && !pendingPaymentFallback) return;

    const numericValue = pickFirstDefined(
      parseNumericValue(paymentInfo?.amount),
      parseNumericValue(paymentInfo?.total),
      parseNumericValue(paymentInfo?.total_amount),
      parseNumericValue(paymentInfo?.price),
      parseNumericValue(pendingPaymentFallback?.amount),
      parseNumericValue(itemInfo?.price),
      parseNumericValue(itemInfo?.sale_price)
    );

    const currencyRaw = pickFirstDefined(
      paymentInfo?.currency,
      paymentInfo?.currency_code,
      paymentInfo?.currencyCode,
      pendingPaymentFallback?.currency,
      paymentInfo?.currency_symbol
    );
    const currency =
      typeof currencyRaw === 'string' && currencyRaw.trim()
        ? currencyRaw.trim().toUpperCase()
        : undefined;

    const conversionParams = {
      item_type: itemType || pendingPaymentFallback?.itemType || 'unknown',
      item_id: itemId || pendingPaymentFallback?.itemId,
    };

    const transactionId = pickFirstDefined(
      payment_id,
      paymentInfo?.id,
      paymentInfo?.payment_id,
      pendingPaymentFallback?.paymentId
    );
    if (transactionId) {
      conversionParams.transaction_id = transactionId;
    }

    if (numericValue !== undefined) {
      conversionParams.value = numericValue;
    }

    if (currency) {
      conversionParams.currency = currency;
    }

    if (resolvedPlanRole) {
      conversionParams.plan_role = resolvedPlanRole;
    }

    let sent = false;
    const events = ['purchase'];
    const type = conversionParams.item_type;
    if (type === 'plan') events.push('subscription');
    if (type === 'class') events.push('class_enrollment');
    if (type === 'tutorial') events.push('tutorial_enrollment');
    if (type === 'book') events.push('book_purchase');

    events.forEach((eventKey) => {
      if (recordGoogleAdsConversion(eventKey, conversionParams)) {
        sent = true;
      }
    });

    if (sent) {
      conversionTrackedRef.current = true;
    }
  }, [
    loading,
    itemType,
    itemId,
    payment_id,
    paymentInfo,
    pendingPaymentFallback,
    itemInfo,
    resolvedPlanRole,
  ]);

  const handleDownloadInvoice = () => {
    if (!invoiceInfo?.id) return;
    if (itemType === 'plan' && resolvedPlanRole === 'instructor') {
      downloadInstructorInvoice(invoiceInfo.id);
    } else {
      downloadStudentInvoice(invoiceInfo.id);
    }
  };

  if (loading) return <div className="text-white text-center mt-32">Loading...</div>;

  let message = 'Your payment was successful!';
  let link = '/';
  let linkLabel = 'Go to Dashboard';

  if (itemType === 'class') {
    message = itemInfo
      ? `You have successfully enrolled in ${itemInfo.title}.`
      : 'You have successfully enrolled in the class.';
    link = '/dashboard/student/online-classes';
    linkLabel = 'Go to My Classes';
  } else if (itemType === 'book') {
    message = itemInfo
      ? `You have successfully purchased ${itemInfo.title}.`
      : 'Your book purchase was successful.';
    link = '/dashboard/student/library';
    linkLabel = 'Go to My Library';
  } else if (itemType === 'tutorial') {
    message = itemInfo
      ? `You have successfully enrolled in ${itemInfo.title}.`
      : 'You have successfully enrolled in the tutorial.';
    link = '/dashboard/student/tutorials';
    linkLabel = 'Go to My Tutorials';
  } else if (itemType === 'plan') {
    const planName =
      subscriptionInfo?.name || itemInfo?.title || itemInfo?.name;
    if (subscriptionInfo) {
      const start = new Date(subscriptionInfo.start_date).toLocaleDateString();
      const end = new Date(subscriptionInfo.end_date).toLocaleDateString();
      message = `Your ${subscriptionInfo.interval} subscription to ${planName} is active from ${start} to ${end}.`;
    } else {
      message = planName
        ? `Your subscription to ${planName} is now active.`
        : 'Your subscription is now active.';
    }
    const roleForRedirect = resolvedPlanRole || 'student';
    link =
      roleForRedirect === 'instructor'
        ? '/dashboard/instructor/settings'
        : '/dashboard/student/settings?tab=billing';
    linkLabel = 'Manage Billing';
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-white">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-24 text-center">
        {bannerMessage && (
          <div className="bg-green-600 text-white px-4 py-3 rounded-md mb-6">
            {bannerMessage}
          </div>
        )}
        <div className="flex flex-col items-center space-y-6">
          <FaCheckCircle size={64} className="text-green-400 animate-pulse" />
          <h1 className="text-4xl font-bold text-yellow-400">Payment Successful!</h1>
          <p className="text-lg text-gray-300">{message}</p>

          {paymentInfo?.status === 'awaiting_approval' && (
            <div className="bg-gray-800 px-6 py-5 rounded-xl shadow-md w-full text-left mt-4">
              <p className="text-sm text-yellow-400">{t('bank_transfer_pending')}</p>
            </div>
          )}

          {itemType === 'class' && (
            <div className="bg-gray-800 px-6 py-5 rounded-xl shadow-md w-full text-left mt-4">
              <p className="flex items-center gap-2 text-sm text-gray-300">
                <FaChalkboardTeacher /> Instructor access and classroom link will be shown in your dashboard once class starts.
              </p>
              <p className="flex items-center gap-2 text-sm text-gray-300 mt-2">
                <FaCalendarAlt /> You&apos;ll also receive updates via email, WhatsApp, SMS, and dashboard notifications.
              </p>
            </div>
          )}

          {itemType === 'book' && (
            <div className="bg-gray-800 px-6 py-5 rounded-xl shadow-md w-full text-left mt-4">
              <p className="flex items-center gap-2 text-sm text-gray-300">
                <FaDownload /> Your book is available in your library for download.
              </p>
            </div>
          )}

          {itemType === 'tutorial' && (
            <div className="bg-gray-800 px-6 py-5 rounded-xl shadow-md w-full text-left mt-4">
              <p className="flex items-center gap-2 text-sm text-gray-300">
                <FaChalkboardTeacher /> You can access this tutorial from your dashboard anytime.
              </p>
            </div>
          )}

          {itemType === 'plan' && (
            <div className="bg-gray-800 px-6 py-5 rounded-xl shadow-md w-full text-left mt-4">
              <p className="flex items-center gap-2 text-sm text-gray-300">
                <FaCalendarAlt /> You can manage your subscription from your billing settings.
              </p>
            </div>
          )}

          {fetchError && (
            <div className="bg-red-600 text-white px-4 py-2 rounded w-full">
              {fetchError}
              <button
                onClick={loadData}
                className="ml-2 underline text-yellow-200"
              >
                Retry
              </button>
            </div>
          )}

          {subscriptionError && (
            <div className="bg-red-600 text-white px-4 py-2 rounded w-full">
              {subscriptionError}
              <button
                onClick={confirmPlanSubscription}
                className="ml-2 underline text-yellow-200"
              >
                Retry
              </button>
            </div>
          )}

          <div className="text-left mt-6 text-sm text-gray-400 bg-gray-800 px-6 py-4 rounded-xl w-full">
            <p><strong>Invoice ID:</strong> {invoiceInfo?.id || paymentInfo?.id || '-'}</p>
            <p>
              <strong>Paid Amount:</strong>{' '}
              {invoiceInfo
                ? `${invoiceInfo.amount} ${invoiceInfo.currency}`
                : paymentInfo
                ? `$${paymentInfo.amount}`
                : '-'}
            </p>
            <p>
              <strong>Payment Method:</strong> {paymentInfo?.method_name || '-'}
            </p>
            <button
              onClick={handleDownloadInvoice}
              disabled={!invoiceInfo}
              className="mt-3 flex items-center gap-2 text-yellow-400 hover:underline disabled:opacity-50"
            >
              <FaRegFilePdf /> Download PDF Receipt
            </button>
          </div>

          <Link
            href={link}
            className="inline-flex items-center gap-2 mt-6 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold px-6 py-3 rounded-full transition-all"
          >
            {linkLabel} <FaArrowRight />
          </Link>

          <p className="text-sm text-gray-500 mt-4">
            Need help?{' '}
            <Link href="/support" className="text-yellow-400 underline">
              Contact Support
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
