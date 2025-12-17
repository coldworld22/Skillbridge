import { useRouter } from "next/router";
import PageHead from "@/components/common/PageHead";
import Link from "next/link";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import styles from "../support.module.scss";

// Mock FAQ data (to be replaced with real API or CMS)
const mockArticles = {
  1: {
    title: "How can I request a refund?",
    content: "To request a refund, please visit your account dashboard, go to 'My Purchases', and select the 'Request Refund' option. Note that our refund policy allows refunds within 14 days of purchase, provided the course was not completed.",
  },
  2: {
    title: "What payment methods are supported?",
    content: "We currently accept Visa, MasterCard, PayPal, and USDT. For other payment options, please contact support.",
  },
  3: {
    title: "How do I join a live class?",
    content: "Log into your dashboard, go to 'My Classes', and click the 'Join Live' button next to the active session. Live classes are hosted via Zoom or our in-app player.",
  },
  // ... more mock data
};

export default function ArticlePage() {
  const router = useRouter();
  const { id } = router.query;
  const article = mockArticles[id];

  return (
    <div className={styles.page}>
      <PageHead title={article ? `${article.title} - Support` : 'Loading...'} />
      <Navbar />
      <main className={styles.container} style={{ maxWidth: "64rem" }}>
        {article ? (
          <>
            <h1 className={styles.title}>{article.title}</h1>
            <p className={styles.article} style={{ whiteSpace: "pre-line" }}>{article.content}</p>
            <Link href="/support" className={styles.link}>← Back to Help Center</Link>
          </>
        ) : (
          <p className={styles.state}>Loading article...</p>
        )}
      </main>
      <Footer />
    </div>
  );
}

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../../next-i18next.config.js';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
