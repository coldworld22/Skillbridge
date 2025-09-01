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
import useCartStore from '@/store/cart/cartStore';
import { toast } from 'react-toastify';
import useLibraryStore from '@/store/libraryStore';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { itemType, itemId } = router.query;
  const [itemInfo, setItemInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const removeItem = useCartStore((state) => state.removeItem);
  const { fetchLibrary } = useLibraryStore();

  useEffect(() => {
    const handle = async () => {
      if (!itemType || !itemId) {
        await fetchLibrary();
        setLoading(false);
        return;
      }

      try {
        if (itemType === 'class') {
          try {
            await enrollInClass(itemId);
            await removeItem(itemId);
          } catch (_) {
            toast.error('Failed to register for class');
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
          try {
            await enrollInTutorial(itemId);
          } catch (_) {
            toast.error('Failed to enroll in tutorial');
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
      } finally {
        await fetchLibrary();
        setLoading(false);
      }
    };
    handle();
  }, [itemType, itemId, fetchLibrary, removeItem]);

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
    message = itemInfo
      ? `Your subscription to ${itemInfo.title || itemInfo.name} is now active.`
      : 'Your subscription is now active.';
    link = '/dashboard/student/settings?tab=billing';
    linkLabel = 'Manage Billing';
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-white">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="flex flex-col items-center space-y-6">
          <FaCheckCircle size={64} className="text-green-400 animate-pulse" />
          <h1 className="text-4xl font-bold text-yellow-400">Payment Successful!</h1>
          <p className="text-lg text-gray-300">{message}</p>

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

          <div className="text-left mt-6 text-sm text-gray-400 bg-gray-800 px-6 py-4 rounded-xl w-full">
            <p><strong>Invoice ID:</strong> INV-{Date.now().toString().slice(-6)}</p>
            <p><strong>Paid Amount:</strong> $49</p>
            <p><strong>Payment Method:</strong> Simulated</p>
            <button className="mt-3 flex items-center gap-2 text-yellow-400 hover:underline">
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
