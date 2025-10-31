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
    <div className="overflow-x-hidden">
      <Navbar />
      <IncompleteAlertModal />

      {sections.map(({ component: Component, props }, index) => (
        <section key={index} ref={sectionRefs.current[index]}>
          <Component {...props} />
        </section>
      ))}

      {/* Scroll Progress Bar */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 w-2 h-40 bg-gray-800 rounded-full z-50 hidden md:block">
        <motion.div
          style={{ height: `${scrollProgress}%` }}
          className="w-full bg-white rounded-full"
        />
      </div>

      {/* Smooth Scroll Buttons */}
      <div className="fixed bottom-8 right-8 z-50 gap-4 hidden md:flex md:flex-col">
        {currentSection > 0 && (
          <motion.button whileHover={{ scale: 1.2 }} onClick={() => scrollToSection(currentSection - 1)}
            className="bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition">
            <FaArrowUp size={20} />
          </motion.button>
        )}
        {currentSection < sections.length - 1 && (
          <motion.button whileHover={{ scale: 1.2 }} onClick={() => scrollToSection(currentSection + 1)}
            className="bg-yellow-500 text-gray-900 p-3 rounded-full shadow-lg hover:bg-yellow-600 transition">
            <FaArrowDown size={20} />
          </motion.button>
        )}
      </div>
    </div>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'website'], nextI18NextConfig)),
    },
  };
}
