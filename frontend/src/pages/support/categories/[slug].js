import { useRouter } from "next/router";
import PageHead from "@/components/common/PageHead";
import Link from "next/link";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import styles from "../support.module.scss";

const mockFaqCategories = {
  billing: {
    title: "Billing & Payments",
    faqs: [
      { id: 1, question: "How can I request a refund?" },
      { id: 2, question: "What payment methods are supported?" },
    ],
  },
  classes: {
    title: "Online Classes",
    faqs: [
      { id: 3, question: "How do I join a live class?" },
      { id: 4, question: "Can I access completed lessons?" },
    ],
  },
  technical: {
    title: "Technical Support",
    faqs: [
      { id: 5, question: "Why can’t I log in?" },
      { id: 6, question: "Video won’t play, what do I do?" },
    ],
  },
};

export default function SupportCategoryPage() {
  const router = useRouter();
  const { slug } = router.query;
  const category = mockFaqCategories[slug];

  return (
    <div className={styles.page}>
      <PageHead title={category ? `${category.title} - Support` : 'Loading...'} />
      <Navbar />
      <main className={styles.container} style={{ maxWidth: "64rem" }}>
        {category ? (
          <>
            <h1 className={styles.title}>{category.title}</h1>
            <ul className={styles.list}>
              {category.faqs.map((faq) => (
                <li key={faq.id}>
                  <Link href={`/support/articles/${faq.id}`} className={styles.link}>
                    {faq.question}
                  </Link>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: "1.5rem" }}>
              <Link href="/support" className={styles.link}>← Back to Help Center</Link>
            </div>
          </>
        ) : (
          <p className={styles.state}>Loading category...</p>
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
