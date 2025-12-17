import PageHead from "@/components/common/PageHead";
import Link from "next/link";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import styles from "./support.module.scss";

export default function WebsiteSupportHome() {
  return (
    <div className={styles.page}>
      <PageHead title="Support" />
      <Navbar />
      <main className={styles.hero}>
        <h1 className={styles.heroTitle}>Welcome to the Support Center</h1>
        <p className={styles.heroText}>
          Find answers, get help, or reach out to our support team. We’re here for you.
        </p>

        <div className={styles.supportGrid}>
          <Link href="/support" className={styles.supportCard}>
            <h2 className={styles.supportHeading}>📚 Help Center</h2>
            <p className={styles.supportText}>Browse FAQs and tutorials by category.</p>
          </Link>

          <Link href="/support/submit" className={styles.supportCard}>
            <h2 className={styles.supportHeading}>📝 Submit a Ticket</h2>
            <p className={styles.supportText}>Can’t find your answer? Let us help you personally.</p>
          </Link>

          <Link href="/support/ticket-status" className={styles.supportCard}>
            <h2 className={styles.supportHeading}>📄 My Tickets</h2>
            <p className={styles.supportText}>Check the status of your support requests.</p>
          </Link>

          <Link href="/support/contact" className={styles.supportCard}>
            <h2 className={styles.supportHeading}>📨 Contact Us</h2>
            <p className={styles.supportText}>Have a general inquiry? Send us a message.</p>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
