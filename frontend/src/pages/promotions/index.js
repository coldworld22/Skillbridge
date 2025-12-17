import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import Link from "next/link";
import PageHead from "@/components/common/PageHead";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import styles from "./promotions.module.scss";

const PromotionsPage = () => {
  const router = useRouter();
  const { t } = useTranslation("promotions");
  const { id } = router.query;
  const [promotion, setPromotion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [discountCode, setDiscountCode] = useState("");

  const mockPromotions = {
    1: {
      title: t('mockPromotions.1.title'),
      description: t('mockPromotions.1.description'),
      image: '/shared/assets/images/ads/black-friday.jpg',
      timeLeft: 3600,
      reviews: t('mockPromotions.1.reviews', { returnObjects: true }),
    },
    2: {
      title: t('mockPromotions.2.title'),
      description: t('mockPromotions.2.description'),
      image: '/shared/assets/images/ads/python-bootcamp.jpg',
      timeLeft: 7200,
      reviews: t('mockPromotions.2.reviews', { returnObjects: true }),
    },
    3: {
      title: t('mockPromotions.3.title'),
      description: t('mockPromotions.3.description'),
      image: '/shared/assets/images/ads/ai-masterclass.jpg',
      timeLeft: 5400,
      reviews: t('mockPromotions.3.reviews', { returnObjects: true }),
    },
  };

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
  }, [id, t]);

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
      <div className={styles.state}>
        <p className={styles.stateText}>{t('loading_promotion_details')}</p>
      </div>
    );
  }

  if (!promotion) {
    return (
      <div className={styles.state}>
        <h1 className={styles.stateTitle}>{t('promotion_not_found')}</h1>
        <Link href="/" legacyBehavior>
          <a className={styles.stateLink}>{t('back_to_home')}</a>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
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

      <section className={styles.section}>
        {/* ✅ Breadcrumbs */}
        <nav className={styles.breadcrumbs}>
          <Link href="/" legacyBehavior><a className={styles.breadcrumbLink}>{t('common:home')}</a></Link> /
          <Link href="/promotions" legacyBehavior><a className={styles.breadcrumbLink}> {t('promotions')}</a></Link> /
          <span className={styles.breadcrumbCurrent}> {promotion.title}</span>
        </nav>

        {/* ✅ Promotion Details */}
        <div className={styles.card}>
          {promotion.image && (
            <Image src={promotion.image} alt={promotion.title} width={600} height={350} className={styles.heroImage} />
          )}
          <h1 className={styles.title}>{promotion.title}</h1>
          <p className={styles.description}>{promotion.description}</p>

          {/* ⏳ Countdown Timer */}
          <div className={styles.countdown}>
            {timeLeft > 0
              ? t('offer_expires_in', { time: formatTime(timeLeft) })
              : t('offer_expired')}
          </div>

          {/* ⭐ User Reviews */}
          <div className={styles.reviews}>
            <h3 className={styles.reviewsTitle}>{t('what_people_are_saying')}</h3>
            {promotion.reviews.map((review, index) => (
              <p key={index} className={styles.reviewItem}>“{review}”</p>
            ))}
          </div>

          {/* 🎟️ Discount Code Input */}
          <div className={styles.discountRow}>
            <input
              type="text"
              placeholder={t('enter_discount_code')}
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              className={styles.discountInput}
            />
            <button
              className={styles.applyBtn}
              onClick={() => alert(t('applied_code', { code: discountCode }))}
            >
              {t('common:apply')}
            </button>
          </div>

          {/* ✅ Claim Offer Button */}
          <Link href={`/checkout?promotion=${id}`} legacyBehavior>
            <a className={styles.claimBtn}>
              {t('claim_offer_now')}
            </a>
          </Link>
        </div>
      </section>

      {/* ✅ Footer */}
      <Footer />
    </div>
  );
};

export default PromotionsPage;

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'promotions'], nextI18NextConfig)),
    },
  };
}
