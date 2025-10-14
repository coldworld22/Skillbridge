// pages/payments/success.js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
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
  fetchInvoiceByPaymentId,
  downloadInvoice,
} from '@/services/student/invoiceService';
import { subscribeToPlan, fetchMySubscription } from '@/services/subscriptionService';
import useCartStore from '@/store/cart/cartStore';
import { toast } from 'react-toastify';
import useLibraryStore from '@/store/libraryStore';
import { useTranslation } from 'next-i18next';
import useSubscriptionStore from '@/store/subscriptionStore';

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
  const removeItem = useCartStore((state) => state.removeItem);
  const { fetchLibrary } = useLibraryStore();
  const fetchSubscription = useSubscriptionStore((state) => state.fetch);

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

  const confirmPlanSubscription = async () => {
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
    } catch (_) {
      setSubscriptionError('Failed to activate subscription');
    }
  };

  const loadData = async () => {
    if (!itemType || !itemId) {
      await fetchLibrary();
      setLoading(false);
      return;
    }

    setFetchError(null);

    let payment = null;
    try {
      if (itemType === 'class') {
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
        try {
          const details = await fetchBook(itemId);
          setItemInfo(details?.data ?? details);
        } catch (_) {
          setItemInfo(null);
        }
      } else if (itemType === 'tutorial') {
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
          setItemInfo({ ...data, title: data.name });
        } catch (_) {
          setItemInfo(null);
        }
      }

      if (payment_id) {
        try {
          const [payments, invoice] = await Promise.all([
            fetchMyPayments(),
            fetchInvoiceByPaymentId(payment_id),
          ]);
          payment = payments.find(
            (p) => String(p.id) === String(payment_id)
          );
          setPaymentInfo(payment || null);
          setInvoiceInfo(invoice);
        } catch (_) {
          setFetchError('Failed to load payment details');
        }
      }

      if (itemType === 'plan' && (!payment_id || payment?.status === 'paid')) {
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
  };

  useEffect(() => {
    loadData();
  }, [itemType, itemId, payment_id]);

  const handleDownloadInvoice = () => {
    if (invoiceInfo?.id) downloadInvoice(invoiceInfo.id);
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
    link = '/dashboard/student/settings?tab=billing';
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
                <FaCalendarAlt /> You'll also receive updates via email, WhatsApp, SMS, and dashboard notifications.
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
            Need help? <a href="/support" className="text-yellow-400 underline">Contact Support</a>
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
