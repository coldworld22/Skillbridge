import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import Navbar from "@/components/website/sections/Navbar";
import Hero from "@/components/website/sections/Hero";
import OnlineClasses from "@/components/website/sections/OnlineClasses";
import StudyCategories from "@/components/website/sections/StudyCategories";
import CommunityEngagement from "@/components/website/sections/CommunityEngagement";
import LearningMarketplace from "@/components/website/sections/LearningMarketplace";
import StudyGroups from "@/components/website/sections/StudyGroups";
import InstructorBooking from "@/components/website/sections/InstructorBooking";
import SubscriptionPlans from "@/components/website/sections/SubscriptionPlans";
import TutorialsSection from "@/components/website/sections/TutorialsSection";
import BooksSection from "@/components/website/sections/BooksSection";
import Footer from "@/components/website/sections/Footer";
import AITutoring from "@/components/website/sections/AITutoring";
import IncompleteAlertModal from "@/components/auth/IncompleteAlertModal";
import useAuthStore from "@/store/auth/authStore";
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';
import styles from "./website.module.scss";


export default function Home() {
  const { user } = useAuthStore();
  const normalizedRole = (user?.role || "").toLowerCase();
  const planRole = normalizedRole === "instructor"
    ? "instructor"
    : ["admin", "superadmin"].includes(normalizedRole)
      ? "all"
      : "student";

  const sections = [
    { component: Hero },
    { component: OnlineClasses },
    { component: TutorialsSection },
    { component: BooksSection },
    { component: LearningMarketplace },
    { component: StudyCategories },
    { component: StudyGroups },
    { component: InstructorBooking },
    { component: SubscriptionPlans, props: { role: planRole } },
    { component: AITutoring },
    { component: CommunityEngagement },
    { component: Footer }, // ✅ Removed last section before the footer
  ];

  const sectionRefs = useRef(sections.map(() => useRef(null)));
  const [currentSection, setCurrentSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  // Intentionally no console logs to avoid leaking user data

  // Track scrolling position
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const docHeight =
            document.documentElement.scrollHeight - window.innerHeight;
          const progress = (scrollY / docHeight) * 100;
          setScrollProgress(progress);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scrolling to sections
  const scrollToSection = (index) => {
    if (sectionRefs.current[index]?.current) {
      sectionRefs.current[index].current.scrollIntoView({ behavior: "smooth" });
      setCurrentSection(index);
    }
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <IncompleteAlertModal />

      {sections.map(({ component: Component, props }, index) => (
        <section key={index} ref={sectionRefs.current[index]}>
          <Component {...props} />
        </section>
      ))}

      {/* Scroll Progress Bar */}
      <div className={styles.progressRail}>
        <motion.div
          style={{ height: `${scrollProgress}%` }}
          className={styles.progressBar}
        />
      </div>

      {/* Smooth Scroll Buttons */}
      <div className={styles.scrollButtons}>
        {currentSection > 0 && (
          <motion.button whileHover={{ scale: 1.2 }} onClick={() => scrollToSection(currentSection - 1)}
            className={styles.roundBtn}>
            <FaArrowUp size={20} />
          </motion.button>
        )}
        {currentSection < sections.length - 1 && (
          <motion.button whileHover={{ scale: 1.2 }} onClick={() => scrollToSection(currentSection + 1)}
            className={`${styles.roundBtn} ${styles.roundBtnAccent}`}>
            <FaArrowDown size={20} />
          </motion.button>
        )}
      </div>
    </div>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'website', 'dashboard'], nextI18NextConfig)),
    },
  };
}
