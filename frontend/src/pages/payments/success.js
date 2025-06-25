// pages/payments/success.js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';
import { FaCheckCircle, FaArrowRight, FaCalendarAlt, FaChalkboardTeacher, FaDownload, FaRegFilePdf } from 'react-icons/fa';
import { enrollInClass, fetchClassDetails } from '@/services/classService';
import { toast } from 'react-toastify';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { classId } = router.query;
  const [classInfo, setClassInfo] = useState(null);

  useEffect(() => {
    if (!classId) return;
    const enroll = async () => {
      try {
        await enrollInClass(classId);
      } catch (_) {
        toast.error('Failed to register for class');
      }
      try {
        const details = await fetchClassDetails(classId);
        setClassInfo(details?.data ?? details);
      } catch (_) {
        setClassInfo(null);
      }
    };
    enroll();
  }, [classId]);

  if (!classInfo) return <div className="text-white text-center mt-32">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-white">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="flex flex-col items-center space-y-6">
          <FaCheckCircle size={64} className="text-green-400 animate-pulse" />
          <h1 className="text-4xl font-bold text-yellow-400">Payment Successful!</h1>
          <p className="text-lg text-gray-300">
            You have successfully enrolled in <span className="font-semibold text-white">{classInfo.title}</span>.
          </p>

          <div className="bg-gray-800 px-6 py-5 rounded-xl shadow-md w-full text-left mt-4">
            <p className="flex items-center gap-2 text-sm text-gray-300">
              <FaChalkboardTeacher /> Instructor access and classroom link will be shown in your dashboard once class starts.
            </p>
            <p className="flex items-center gap-2 text-sm text-gray-300 mt-2">
              <FaCalendarAlt /> You'll also receive updates via email, WhatsApp, SMS, and dashboard notifications.
            </p>
          </div>

          <div className="text-left mt-6 text-sm text-gray-400 bg-gray-800 px-6 py-4 rounded-xl w-full">
            <p><strong>Invoice ID:</strong> INV-{Date.now().toString().slice(-6)}</p>
            <p><strong>Paid Amount:</strong> $49</p>
            <p><strong>Payment Method:</strong> Simulated</p>
            <button className="mt-3 flex items-center gap-2 text-yellow-400 hover:underline">
              <FaRegFilePdf /> Download PDF Receipt
            </button>
          </div>

          <Link
            href="/dashboard/student/online-classe"
            className="inline-flex items-center gap-2 mt-6 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold px-6 py-3 rounded-full transition-all"
          >
            Go to My Classes <FaArrowRight />
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
