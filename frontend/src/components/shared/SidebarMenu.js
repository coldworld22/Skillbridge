import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  FaBookOpen, FaChalkboardTeacher, FaGraduationCap, FaUsers,
  FaCalendarAlt, FaPlus, FaChartLine, FaTimes, FaUserShield,
  FaBullhorn, FaQuestionCircle, FaFileAlt, FaEnvelope
} from "react-icons/fa";
import useAuthStore from "@/store/auth/authStore";

const SidebarMenu = ({ isOpen, onClose, showAds }) => {
  const sidebarRef = useRef(null);
  const router = useRouter();
  const { user } = useAuthStore();
  const userRole = user?.role?.toLowerCase();

  console.log("🔍 SidebarMenu Loaded | Role:", userRole, "| User:", user)

  const [hydrated, setHydrated] = useState(false);

  // Ensure hydration-safe rendering
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
  document.body.style.overflow = isOpen ? "hidden" : "auto";
}, [isOpen]);

  // Close sidebar on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Load Google AdSense
  useEffect(() => {
    if (showAds) {
      const script = document.createElement("script");
      script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
      script.async = true;
      script.crossOrigin = "anonymous";
      document.body.appendChild(script);
    }
  }, [showAds]);

  if (!hydrated) return null;

  // Role-based dashboard link
  const dashboardConfig = {
    admin: {
      href: "/dashboard/admin",
      label: "Admin Dashboard",
      icon: <FaUserShield />,
    },
    superadmin: {
      href: "/dashboard/admin",
      label: "Admin Dashboard",
      icon: <FaUserShield />,
    },
    instructor: {
      href: "/dashboard/instructor",
      label: "Instructor Dashboard",
      icon: <FaChalkboardTeacher />,
    },
    student: {
      href: "/dashboard/student",
      label: "Student Dashboard",
      icon: <FaGraduationCap />,
    },
  };

  const currentDashboard = dashboardConfig[userRole];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black backdrop-blur-md z-40"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            ref={sidebarRef}
            className="fixed top-0 left-0 h-screen w-72 bg-gradient-to-b from-yellow-500 to-yellow-400 text-gray-900 shadow-lg z-[60] pt-20 overflow-y-auto"

          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-900 hover:text-gray-800 transition"
            >
              <FaTimes className="text-2xl" />
            </button>

            <h3 className="text-xl font-bold mb-4">Dashboard Navigation</h3>
            <div className="space-y-4">

              {/* Dashboard Link */}
              {currentDashboard && (
                <Link
                  href={currentDashboard.href}
                  className="flex items-center gap-3 p-2 w-full text-left text-gray-900 bg-yellow-600 hover:bg-yellow-700 rounded-lg cursor-pointer transition"
                >
                  {currentDashboard.icon} {currentDashboard.label}
                </Link>
              )}

              {/* Useful Links */}
              <div>
                <h4 className="font-bold text-lg mt-6 mb-2">Useful Links</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="/courses" className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                      <FaBookOpen /> Explore Courses
                    </Link>
                  </li>
                  <li>
                    <Link href="/community" className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                      <FaUsers /> Community Forum
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog" className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                      <FaFileAlt /> Blog & News
                    </Link>
                  </li>
                  <li>
                    <Link href="/support" className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                      <FaQuestionCircle /> Help & Support
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                      <FaEnvelope /> Contact Us
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Student Section */}
              {userRole === "student" && (
                <div>
                  <h4 className="font-bold text-lg mt-6 mb-2">Learning</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                      <FaBookOpen /> My Courses
                    </li>
                    <li className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                      <FaChalkboardTeacher /> My Instructors
                    </li>
                    <li className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                      <FaGraduationCap /> Certificates
                    </li>
                  </ul>
                </div>
              )}

              {/* Instructor Section */}
              {userRole === "instructor" && (
                <div>
                  <h4 className="font-bold text-lg mt-6 mb-2">Instructor Tools</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                      <FaCalendarAlt /> Scheduled Classes
                    </li>
                    <li className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                      <FaPlus /> Create Course
                    </li>
                    <li className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                      <FaChartLine /> Earnings & Reports
                    </li>
                  </ul>
                </div>
              )}

              {/* Google Ads */}
              {showAds && (
                <div className="mt-6 p-3 bg-white text-gray-900 shadow-lg rounded-lg">
                  <h4 className="text-lg font-bold mb-2 flex items-center gap-2">
                    <FaBullhorn /> Sponsored Ads
                  </h4>
                  <div className="text-center">
                    <ins className="adsbygoogle"
                      style={{ display: "block" }}
                      data-ad-client="ca-pub-xxxxxxxxxxxxxxxx"
                      data-ad-slot="1234567890"
                      data-ad-format="auto"
                      data-full-width-responsive="true"
                    ></ins>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SidebarMenu;
