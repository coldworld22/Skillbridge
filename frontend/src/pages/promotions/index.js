import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import Link from "next/link";
import PageHead from "@/components/common/PageHead";
import Head from "next/head";
import { useTranslation } from "next-i18next";

const mockPromotions = {
  1: { title: "🔥 Black Friday Deal: 50% Off!", description: "All courses now at half price!", image: "/shared/assets/images/ads/black-friday.jpg", timeLeft: 3600, reviews: ["Great deal!", "Loved it!", "Highly recommended!"] },
  2: { title: "📢 Python Bootcamp Enrollment Open!", description: "Join our advanced Python bootcamp!", image: "/shared/assets/images/ads/python-bootcamp.jpg", timeLeft: 7200, reviews: ["Super informative!", "Best bootcamp!", "Worth every penny!"] },
  3: { title: "🚀 AI Masterclass Discount!", description: "Learn AI from top instructors!", image: "/shared/assets/images/ads/ai-masterclass.jpg", timeLeft: 5400, reviews: ["Perfect for beginners!", "Very detailed", "Loved the instructors!"] },
};

const PromotionsPage = () => {
  const router = useRouter();
  const { t } = useTranslation("promotions");
  const { id } = router.query;
  const [promotion, setPromotion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [discountCode, setDiscountCode] = useState("");

  // Fetch Promotion Data or Use Mock Data
  useEffect(() => {
    if (id) {
      const promoId = parseInt(id, 10);
      const promo = mockPromotions[promoId] || null;
      setPromotion(promo);
      if (promo) setTimeLeft(promo.timeLeft);
    } else {
      setPromotion(mockPromotions[1]);
      setTimeLeft(mockPromotions[1].timeLeft);
    }
    setLoading(false);
  }, [id]);

  // Countdown Timer
  useEffect(() => {
    if (!timeLeft) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Format Time (HH:MM:SS)
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500 text-xl">{t('loading_promotion_details')}</p>
      </div>
    );
  }

  if (!promotion) {
    return (
      <div className="text-center mt-20">
        <h1 className="text-3xl font-bold text-red-500">{t('promotion_not_found')}</h1>
        <Link href="/" legacyBehavior>
          <a className="text-blue-500 hover:underline mt-4 inline-block">{t('back_to_home')}</a>
        </Link>
      </div>
    );
  }

  return (
    <>
      <PageHead title={`${promotion.title} - ${t('special_offer')}`} />
      <Head>
        <meta name="description" content={promotion.description} />
        {/* SEO & Social Media Metadata */}
        <meta property="og:title" content={promotion.title} />
        <meta property="og:description" content={promotion.description} />
        <meta property="og:image" content={promotion.image} />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content={promotion.title} />
        <meta name="twitter:description" content={promotion.description} />
        <meta name="twitter:image" content={promotion.image} />
      </Head>

      {/* ✅ Navbar */}
      <Navbar />

      <section className="container mx-auto px-6 py-8 mt-16">
        {/* ✅ Breadcrumbs */}
        <nav className="mb-4 text-gray-400 text-sm">
          <Link href="/" legacyBehavior><a className="hover:text-blue-500">{t('common:home')}</a></Link> /
          <Link href="/promotions" legacyBehavior><a className="hover:text-blue-500"> {t('promotions')}</a></Link> /
          <span className="text-yellow-500"> {promotion.title}</span>
        </nav>

        {/* ✅ Promotion Details */}
        <div className="bg-gray-900 text-white p-8 rounded-lg shadow-lg text-center">
          {promotion.image && (
            <Image src={promotion.image} alt={promotion.title} width={600} height={350} className="mx-auto rounded-lg" />
          )}
          <h1 className="text-3xl font-bold mt-6">{promotion.title}</h1>
          <p className="mt-4 text-gray-300">{promotion.description}</p>

          {/* ⏳ Countdown Timer */}
          <div className="text-red-400 text-lg font-bold mt-4">
            {timeLeft > 0
              ? t('offer_expires_in', { time: formatTime(timeLeft) })
              : t('offer_expired')}
          </div>

          {/* ⭐ User Reviews */}
          <div className="mt-6 bg-gray-800 p-4 rounded-lg">
            <h3 className="text-yellow-400 font-semibold">{t('what_people_are_saying')}</h3>
            {promotion.reviews.map((review, index) => (
              <p key={index} className="text-gray-300 italic">“{review}”</p>
            ))}
          </div>

          {/* 🎟️ Discount Code Input */}
          <div className="mt-4">
            <input
              type="text"
              placeholder={t('enter_discount_code')}
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              className="px-4 py-2 rounded-md border border-gray-700 bg-gray-800 text-white"
            />
            <button
              className="ml-2 px-4 py-2 bg-green-500 text-gray-900 rounded-md font-semibold hover:bg-green-600 transition"
              onClick={() => alert(t('applied_code', { code: discountCode }))}
            >
              {t('common:apply')}
            </button>
          </div>

          {/* ✅ Claim Offer Button */}
          <Link href={`/checkout?promotion=${id}`} legacyBehavior>
            <a className="mt-6 inline-block bg-yellow-500 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition">
              {t('claim_offer_now')}
            </a>
          </Link>
        </div>
      </section>

      {/* ✅ Footer */}
      <Footer />
    </>
  );
};

export default PromotionsPage;

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'promotions'], nextI18NextConfig)),
    },
  };
}
