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
import styles from "./SidebarMenu.module.scss";

const SidebarMenu = ({ isOpen, onClose }) => {
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
            className={styles.overlay}
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            ref={sidebarRef}
            className={styles.panel}

          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className={styles.close}
            >
              <FaTimes className="text-2xl" />
            </button>

            <h3 className={styles.title}>{t('dashboard_navigation')}</h3>
            <div className={styles.section}>

              {/* Dashboard Link */}
              {user && (
                <Link href={currentDashboard.href} className={styles.link}>
                  {currentDashboard.icon} {currentDashboard.label}
                </Link>
              )}

              {/* Quick Links */}
              <div>
                <h4 className={styles.subheading}>{quickLinksTitle}</h4>
                <ul className={styles.list}>
                  {quickLinks.map(({ href, label, icon }) => (
                    <li key={`${href}-${label}`} className={styles.listItem}>
                      <Link href={href} className={styles.link}>
                        {icon} {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Student Section */}
              {userRole === "student" && (
                <div>
                  <h4 className={styles.subheading}>{t('learning')}</h4>
                  <ul className={styles.list}>
                    <li className={styles.listItem}>
                      <span className={styles.link}><FaBookOpen /> {t('my_courses')}</span>
                    </li>
                    <li className={styles.listItem}>
                      <span className={styles.link}><FaChalkboardTeacher /> {t('my_instructors')}</span>
                    </li>
                    <li className={styles.listItem}>
                      <span className={styles.link}><FaGraduationCap /> {t('certificates')}</span>
                    </li>
                  </ul>
                </div>
              )}

              {/* Instructor Section */}
              {userRole === "instructor" && (
                <div>
                  <h4 className={styles.subheading}>{t('instructor_tools')}</h4>
                  <ul className={styles.list}>
                    <li className={styles.listItem}>
                      <span className={styles.link}><FaCalendarAlt /> {t('scheduled_classes')}</span>
                    </li>
                    <li className={styles.listItem}>
                      <span className={styles.link}><FaPlus /> {t('create_course')}</span>
                    </li>
                    <li className={styles.listItem}>
                      <span className={styles.link}><FaChartLine /> {t('earnings_reports')}</span>
                    </li>
                  </ul>
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
