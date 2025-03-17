import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import Navbar from "@/components/website/sections/Navbar";
import Hero from "@/components/website/sections/Hero";
import OnlineClasses from "@/components/website/sections/OnlineClasses";
import StudyCategories from "@/components/website/sections/StudyCategories";
import FeaturedCourses from "@/components/website/sections/FeaturedCourses";
import CommunityEngagement from "@/components/website/sections/CommunityEngagement";
import FeaturedInstructors from "@/components/website/sections/FeaturedInstructors";
import LearningMarketplace from "@/components/website/sections/LearningMarketplace";
import StudyGroups from "@/components/website/sections/StudyGroups";
import InstructorBooking from "@/components/website/sections/InstructorBooking";
import SubscriptionPlans from "@/components/website/sections/SubscriptionPlans";
import TutorialsSection from "@/components/website/sections/TutorialsSection";
import Footer from "@/components/website/sections/Footer";
import ProblemSolvingSection from "@/components/website/sections/ProblemSolvingSection";
import AITutoring from "@/components/website/sections/AITutoring";

export default function Home() {
  const sections = [
    Hero, OnlineClasses, LearningMarketplace, StudyCategories,
    StudyGroups, InstructorBooking, SubscriptionPlans, TutorialsSection,
    ProblemSolvingSection, AITutoring, FeaturedCourses, CommunityEngagement,
    FeaturedInstructors, Footer // ✅ Removed last section before the footer
  ];

  const sectionRefs = useRef(sections.map(() => useRef(null)));
  const [currentSection, setCurrentSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Track scrolling position
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollY / docHeight) * 100;
      setScrollProgress(progress);
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
    <div>
      <Navbar />

      {sections.map((Component, index) => (
        <section key={index} ref={sectionRefs.current[index]}>
          <Component />
        </section>
      ))}

      {/* Scroll Progress Bar */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 w-2 h-40 bg-gray-800 rounded-full z-50">
        <motion.div
          style={{ height: `${scrollProgress}%` }}
          className="w-full bg-white rounded-full"
        />
      </div>

      {/* Smooth Scroll Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-50">
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
