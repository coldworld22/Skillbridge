import PageHead from '@/components/common/PageHead';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';
import styles from './about.module.scss';

export default function AboutUsPage() {
  return (
    <>
      <PageHead title="About Us" />
      <Navbar />
      <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>Empowering Global Learning</h1>
        <p className={styles.heroText}>
          SkillBridge connects learners, instructors, and institutions on a unified educational platform.
        </p>
      </section>

      <section className={styles.mission}>
        <h2 className={styles.missionTitle}>Our Mission</h2>
        <p className={styles.missionText}>
          We're on a mission to make high-quality education accessible, flexible, and smart through AI, community, and expert-led content.
        </p>
      </section>

      <section className={styles.features}>
        <div className={styles.grid}>
          {[
            { icon: "🎓", title: "Online Classes", desc: "Structured learning with lessons, assignments, and attendance." },
            { icon: "🤖", title: "AI Tutoring", desc: "Adaptive AI-based tutors and lesson planners." },
            { icon: "💬", title: "Interactive Community", desc: "Ask questions, join groups, and grow with others." },
            { icon: "📈", title: "Instructor Tools", desc: "Advanced dashboards, earnings insights, and class management." },
            { icon: "📜", title: "Certificates", desc: "Auto-issued certificates with QR code verification." },
            { icon: "🔐", title: "Flexible Plans", desc: "Subscription model with customizable access control." }
          ].map((item, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.cardIcon}>{item.icon}</div>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardText}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.cta}>
        <h2 className={styles.ctaTitle}>Join thousands of learners and instructors</h2>
        <p className={styles.ctaText}>Your journey toward smarter, more flexible education starts here.</p>
        <div className={styles.ctaActions}>
          <a href="/register" className={styles.primary}>
            Get Started
          </a>
          <a href="/contact" className={styles.secondary}>
            Contact Us
          </a>
        </div>
      </section>
      </div>
      <Footer />
    </>
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
