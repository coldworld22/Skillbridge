import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import Navbar from "@/components/website/sections/Navbar";
import dynamic from 'next/dynamic';
import IncompleteAlertModal from "@/components/auth/IncompleteAlertModal";
import useAuthStore from "@/store/auth/authStore";
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';


const SectionLoader = () => (
  <div className="py-10 text-center text-gray-500">Loading...</div>
);

export default function Home() {
  const { user } = useAuthStore();
  const planRole = user?.role === "instructor" ? "instructor" : "student";

  const sections = useMemo(() => [
    { component: dynamic(() => import('@/components/website/sections/Hero'), { loading: SectionLoader }) },
    { component: dynamic(() => import('@/components/website/sections/OnlineClasses'), { loading: SectionLoader }) },
    { component: dynamic(() => import('@/components/website/sections/TutorialsSection'), { loading: SectionLoader }) },
    { component: dynamic(() => import('@/components/website/sections/BooksSection'), { loading: SectionLoader }) },
    { component: dynamic(() => import('@/components/website/sections/LearningMarketplace'), { loading: SectionLoader }) },
    { component: dynamic(() => import('@/components/website/sections/StudyCategories'), { loading: SectionLoader }) },
    { component: dynamic(() => import('@/components/website/sections/StudyGroups'), { loading: SectionLoader }) },
    { component: dynamic(() => import('@/components/website/sections/InstructorBooking'), { loading: SectionLoader }) },
    { component: dynamic(() => import('@/components/website/sections/SubscriptionPlans'), { loading: SectionLoader }), props: { role: planRole } },
    { component: dynamic(() => import('@/components/website/sections/AITutoring'), { loading: SectionLoader }) },
    { component: dynamic(() => import('@/components/website/sections/CommunityEngagement'), { loading: SectionLoader }) },
    { component: dynamic(() => import('@/components/website/sections/Footer'), { loading: SectionLoader }) },
  ], [planRole]);

  const sectionRefs = useRef([]);
  if (sectionRefs.current.length !== sections.length) {
    sectionRefs.current = sections.map(
      (_, i) => sectionRefs.current[i] || React.createRef()
    );
  }
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
    const ref = sectionRefs.current[index];
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
      setCurrentSection(index);
    }
  };

  return (
    <div className="overflow-x-hidden">
      <Navbar />
      <IncompleteAlertModal />

      {sections.map(({ component: Component, props }, index) => (
        <section
          key={index}
          ref={(el) => {
            sectionRefs.current[index] = el;
          }}
        >
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
