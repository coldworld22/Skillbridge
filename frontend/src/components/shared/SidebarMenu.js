import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import {
  FaBookOpen,
  FaChalkboardTeacher,
  FaGraduationCap,
  FaCalendarAlt,
  FaPlus,
  FaChartLine,
  FaTimes,
  FaUserShield,
  FaBullhorn,
  FaTachometerAlt,
  FaUsers,
  FaQuestionCircle,
  FaHandsHelping,
  FaLifeRing,
  FaSignInAlt,
  FaUserPlus,
  FaPhone,
  FaInfoCircle,
  FaBell,
  FaHeart,
  FaUser,
  FaEnvelope,
} from "react-icons/fa";
import useAuthStore from "@/store/auth/authStore";
import logger from "@/utils/logger";

const SidebarMenu = ({ isOpen, onClose, showAds }) => {
  const sidebarRef = useRef(null);
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useTranslation("common");
  const userRole = user?.role?.toLowerCase();
  logger.log("🔍 SidebarMenu Loaded | Role:", userRole, "| User:", user);

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
      label: t("admin_dashboard"),
      icon: <FaUserShield />,
    },
    superadmin: {
      href: "/dashboard/admin",
      label: t("admin_dashboard"),
      icon: <FaUserShield />,
    },
    instructor: {
      href: "/dashboard/instructor",
      label: t("instructor_dashboard"),
      icon: <FaChalkboardTeacher />,
    },
    student: {
      href: "/dashboard/student",
      label: t("student_dashboard"),
      icon: <FaGraduationCap />,
    },
  };

  const defaultDashboard = {
    href: "/dashboard",
    label: t("dashboard"),
    icon: <FaTachometerAlt />,
  };

  const currentDashboard = dashboardConfig[userRole] || defaultDashboard;
  const isOnline = Boolean(user);

  const offlineQuickLinks = [
    {
      href: "/online-classes",
      label: t("explore_courses"),
      icon: <FaChalkboardTeacher />,
    },
    {
      href: "/community",
      label: t("community_forum"),
      icon: <FaUsers />,
    },
    {
      href: "/blog",
      label: t("blog_news"),
      icon: <FaBookOpen />,
    },
    {
      href: "/support",
      label: t("help_support"),
      icon: <FaHandsHelping />,
    },
    {
      href: "/faqs",
      label: t("faqs"),
      icon: <FaQuestionCircle />,
    },
    {
      href: "/contact",
      label: t("contact"),
      icon: <FaPhone />,
    },
    {
      href: "/about",
      label: t("about"),
      icon: <FaInfoCircle />,
    },
    {
      href: "/auth/login",
      label: t("login"),
      icon: <FaSignInAlt />,
    },
    {
      href: "/auth/register",
      label: t("register"),
      icon: <FaUserPlus />,
    },
  ];

  const onlineQuickLinks = [
    {
      href: "/online-classes",
      label: t("explore_courses"),
      icon: <FaChalkboardTeacher />,
    },
    {
      href: "/community",
      label: t("community_forum"),
      icon: <FaUsers />,
    },
    {
      href: "/messages",
      label: t("messages"),
      icon: <FaEnvelope />,
    },
    {
      href: "/notifications",
      label: t("notifications"),
      icon: <FaBell />,
    },
    {
      href: "/wishlist",
      label: t("wishlist"),
      icon: <FaHeart />,
    },
    {
      href: "/profile",
      label: t("edit_profile"),
      icon: <FaUser />,
    },
    {
      href: "/support",
      label: t("help_support"),
      icon: <FaLifeRing />,
    },
    {
      href: "/blog",
      label: t("blog_news"),
      icon: <FaBookOpen />,
    },
  ];

  const quickLinks = isOnline ? onlineQuickLinks : offlineQuickLinks;
  const quickLinksTitle = isOnline
    ? t("quick_links_online")
    : t("quick_links_offline");

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

            <h3 className="text-xl font-bold mb-4">{t('dashboard_navigation')}</h3>
            <div className="space-y-4">

              {/* Dashboard Link */}
              {user && (
                <Link
                  href={currentDashboard.href}
                  className="flex items-center gap-3 p-2 w-full text-left text-gray-900 bg-yellow-600 hover:bg-yellow-700 rounded-lg cursor-pointer transition"
                >
                  {currentDashboard.icon} {currentDashboard.label}
                </Link>
              )}

              {/* Quick Links */}
              <div>
                <h4 className="font-bold text-lg mt-6 mb-2">{quickLinksTitle}</h4>
                <ul className="space-y-2">
                  {quickLinks.map(({ href, label, icon }) => (
                    <li key={`${href}-${label}`}>
                      <Link
                        href={href}
                        className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition"
                      >
                        {icon} {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Student Section */}
              {userRole === "student" && (
                <div>
                  <h4 className="font-bold text-lg mt-6 mb-2">{t('learning')}</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                      <FaBookOpen /> {t('my_courses')}
                    </li>
                    <li className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                      <FaChalkboardTeacher /> {t('my_instructors')}
                    </li>
                    <li className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                      <FaGraduationCap /> {t('certificates')}
                    </li>
                  </ul>
                </div>
              )}

              {/* Instructor Section */}
              {userRole === "instructor" && (
                <div>
                  <h4 className="font-bold text-lg mt-6 mb-2">{t('instructor_tools')}</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                      <FaCalendarAlt /> {t('scheduled_classes')}
                    </li>
                    <li className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                      <FaPlus /> {t('create_course')}
                    </li>
                    <li className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                      <FaChartLine /> {t('earnings_reports')}
                    </li>
                  </ul>
                </div>
              )}

              {/* Google Ads */}
              {showAds && (
                <div className="mt-6 p-3 bg-white text-gray-900 shadow-lg rounded-lg">
                  <h4 className="text-lg font-bold mb-2 flex items-center gap-2">
                    <FaBullhorn /> {t('sponsored_ads')}
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
