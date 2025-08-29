import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import PageHead from "@/components/common/PageHead";
import Head from "next/head";
import Link from "next/link";
import { useTranslation } from "next-i18next";

export default function PromotionPage() {
  const router = useRouter();
  const { t } = useTranslation("promotions");
  const { id } = router.query;

  const [promotion, setPromotion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [discountCode, setDiscountCode] = useState("");

  useEffect(() => {
    if (!id) return;
    const fetchPromotion = async () => {
      try {
        const res = await fetch(`/api/ads/${id}`);
        if (!res.ok) throw new Error(t('promotion_not_found'));
        const data = await res.json();
        setPromotion(data);
        if (data.endsAt) {
          const diff = Math.floor((new Date(data.endsAt) - new Date()) / 1000);
          setTimeLeft(diff > 0 ? diff : 0);
        }
      } catch (err) {
        setPromotion(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPromotion();
  }, [id]);

  useEffect(() => {
    if (!timeLeft) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return <div className="min-h-screen flex justify-center items-center text-xl text-gray-500">{t('common:loading')}</div>;
  }

  if (!promotion) {
    return (
      <div className="text-center mt-24">
        <h1 className="text-3xl text-red-600 font-bold">{t('promotion_not_found')}</h1>
        <Link href="/" className="text-blue-500 hover:underline block mt-4">{t('back_to_home')}</Link>
      </div>
    );
  }

  return (
    <>
      <PageHead title={`${promotion.title} - ${t('special_offer')}`} />
      <Head>
        <meta name="description" content={promotion.description} />
        <meta property="og:image" content={promotion.image} />
      </Head>

      <Navbar />

      <section className="container mx-auto px-4 py-10">
        <nav className="text-sm text-gray-400 mb-4">
          <Link href="/" className="hover:text-blue-500">{t('common:home')}</Link> /
          <Link href="/promotions" className="hover:text-blue-500"> {t('promotions')}</Link> /
          <span className="text-yellow-500"> {promotion.title}</span>
        </nav>

        <div className="bg-gray-900 text-white p-8 rounded-lg shadow-lg text-center">
          <Image src={promotion.image} alt={promotion.title} width={600} height={350} className="rounded-lg mx-auto" />

          <h1 className="text-3xl font-bold mt-6">{promotion.title}</h1>
          <p className="text-gray-300 mt-4">{promotion.description}</p>

          {timeLeft > 0 ? (
            <div className="text-red-400 text-lg font-semibold mt-4">
              {t('offer_ends_in', { time: formatTime(timeLeft) })}
            </div>
          ) : (
            <div className="text-red-400 text-lg font-semibold mt-4">{t('offer_expired')}</div>
          )}

          {/* Optional Reviews */}
          {promotion.reviews?.length > 0 && (
            <div className="mt-6 bg-gray-800 p-4 rounded-lg">
              <h3 className="text-yellow-400 font-semibold">{t('what_people_are_saying')}</h3>
              {promotion.reviews.map((review, idx) => (
                <p key={idx} className="text-gray-300 italic">“{review}”</p>
              ))}
            </div>
          )}

          {/* Discount Code */}
          <div className="mt-4">
            <input
              type="text"
              placeholder={t('enter_discount_code')}
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              className="px-4 py-2 rounded-md border border-gray-700 bg-gray-800 text-white"
            />
            <button
              className="ml-2 px-4 py-2 bg-green-500 text-gray-900 rounded-md font-semibold hover:bg-green-600"
              onClick={() => alert(t('applied_code', { code: discountCode }))}
            >
              {t('common:apply')}
            </button>
          </div>

          <Link href={`/checkout?promotion=${promotion.id}`} className="mt-6 inline-block bg-yellow-500 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600">
            {t('claim_offer_now')}
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'promotions'], nextI18NextConfig)),
    },
  };
}
