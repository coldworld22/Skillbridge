import React, { useRef, useEffect, useState, useMemo } from "react";
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
  const getSectionElements = () =>
    sectionRefs.current
      .map((ref) =>
        ref && typeof ref === "object" && Object.prototype.hasOwnProperty.call(ref, "current")
          ? ref.current
          : ref
      )
      .filter(Boolean);
  // Intentionally no console logs to avoid leaking user data

  // Track scrolling position
  useEffect(() => {
    let ticking = false;

    const updateScrollState = () => {
      const scrollY = typeof window.scrollY === "number" ? window.scrollY : 0;
      const docElement = document.documentElement;
      const rawDocHeight = docElement.scrollHeight - window.innerHeight;
      const docHeight = rawDocHeight > 0 ? rawDocHeight : 0;
      const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
      setScrollProgress(Number.isFinite(progress) ? progress : 0);

      const sectionElements = getSectionElements();
      if (!sectionElements.length) {
        setCurrentSection(0);
        return;
      }

      if (typeof window.IntersectionObserver === "undefined") {
        const viewportMid = window.innerHeight / 2;
        let activeIndex = 0;
        let smallestDistance = Infinity;

        sectionElements.forEach((section, index) => {
          if (!section || typeof section.getBoundingClientRect !== "function") {
            return;
          }

          const rect = section.getBoundingClientRect();
          const top = rect?.top ?? 0;
          const bottom = rect?.bottom ?? top;
          const center = top + (bottom - top) / 2;
          const distance = Math.abs(center - viewportMid);

          if (distance < smallestDistance) {
            smallestDistance = distance;
            activeIndex = index;
          }
        });

        setCurrentSection(activeIndex);
      }
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateScrollState();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll);
    updateScrollState();
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [sections.length]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.IntersectionObserver === "undefined"
    ) {
      return undefined;
    }

    const sectionElements = getSectionElements();
    if (!sectionElements.length) {
      return undefined;
    }

    const observer = new window.IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries.length > 0) {
          const targetIndex = sectionElements.findIndex(
            (element) => element === visibleEntries[0].target
          );
          if (targetIndex !== -1) {
            setCurrentSection(targetIndex);
            return;
          }
        }

        const viewportMid = window.innerHeight / 2;
        let closestIndex = 0;
        let smallestDistance = Infinity;

        sectionElements.forEach((section, index) => {
          if (!section || typeof section.getBoundingClientRect !== "function") {
            return;
          }

          const rect = section.getBoundingClientRect();
          const top = rect?.top ?? 0;
          const bottom = rect?.bottom ?? top;
          const center = top + (bottom - top) / 2;
          const distance = Math.abs(center - viewportMid);

          if (distance < smallestDistance) {
            smallestDistance = distance;
            closestIndex = index;
          }
        });

        setCurrentSection(closestIndex);
      },
      { threshold: [0.25, 0.5, 0.75, 1] }
    );

    sectionElements.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
    };
  }, [sections.length]);

  // Smooth scrolling to sections
  const scrollToSection = (index) => {
    const refOrElement = sectionRefs.current[index];
    const element =
      refOrElement &&
      typeof refOrElement === "object" &&
      Object.prototype.hasOwnProperty.call(refOrElement, "current")
        ? refOrElement.current
        : refOrElement;

    if (element && typeof element.scrollIntoView === "function") {
      element.scrollIntoView({ behavior: "smooth" });
      setCurrentSection(index);
    }
  };

  return (
    <div className="overflow-x-hidden" data-current-section={currentSection}>
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
          <motion.button
            aria-label="Scroll to previous section"
            whileHover={{ scale: 1.2 }}
            onClick={() => scrollToSection(currentSection - 1)}
            className="bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition"
          >
            <FaArrowUp size={20} />
          </motion.button>
        )}
        {currentSection < sections.length - 1 && (
          <motion.button
            aria-label="Scroll to next section"
            whileHover={{ scale: 1.2 }}
            onClick={() => scrollToSection(currentSection + 1)}
            className="bg-yellow-500 text-gray-900 p-3 rounded-full shadow-lg hover:bg-yellow-600 transition"
          >
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
