import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import PageHead from "@/components/common/PageHead";
import Head from "next/head";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import styles from "./promotions.module.scss";

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
        <Link href="/" className={styles.stateLink}>{t('back_to_home')}</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageHead title={`${promotion.title} - ${t('special_offer')}`} />
      <Head>
        <meta name="description" content={promotion.description} />
        <meta property="og:image" content={promotion.image} />
      </Head>

      <Navbar />

      <section className={styles.section}>
        <nav className={styles.breadcrumbs}>
          <Link href="/" className={styles.breadcrumbLink}>{t('common:home')}</Link> /
          <Link href="/promotions" className={styles.breadcrumbLink}> {t('promotions')}</Link> /
          <span className={styles.breadcrumbCurrent}> {promotion.title}</span>
        </nav>

        <div className={styles.card}>
          <Image src={promotion.image} alt={promotion.title} width={600} height={350} className={styles.heroImage} />

          <h1 className={styles.title}>{promotion.title}</h1>
          <p className={styles.description}>{promotion.description}</p>

          {timeLeft > 0 ? (
            <div className={styles.countdown}>
              {t('offer_ends_in', { time: formatTime(timeLeft) })}
            </div>
          ) : (
            <div className={styles.countdown}>{t('offer_expired')}</div>
          )}

          {/* Optional Reviews */}
          {promotion.reviews?.length > 0 && (
            <div className={styles.reviews}>
              <h3 className={styles.reviewsTitle}>{t('what_people_are_saying')}</h3>
              {promotion.reviews.map((review, idx) => (
                <p key={idx} className={styles.reviewItem}>“{review}”</p>
              ))}
            </div>
          )}

          {/* Discount Code */}
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

          <Link href={`/checkout?promotion=${promotion.id}`} className={styles.claimBtn}>
            {t('claim_offer_now')}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
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
