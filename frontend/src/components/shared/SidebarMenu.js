import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaHome, FaBookOpen, FaChalkboardTeacher, FaGraduationCap, FaUsers, FaComments,
  FaVideo, FaCalendarAlt, FaPlus, FaChartLine, FaCog, FaStar, FaGift, FaStore, 
  FaTimes, FaDollarSign, FaUserShield, FaUserGraduate, FaUserTie, FaUserFriends, 
  FaCheckCircle, FaBullhorn
} from "react-icons/fa";

const SidebarMenu = ({ isOpen, onClose, userRole, showAds }) => {
  const sidebarRef = useRef(null);

  // Close sidebar when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Load Google AdSense Script
  useEffect(() => {
    if (showAds) {
      const script = document.createElement("script");
      script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
      script.async = true;
      script.crossOrigin = "anonymous";
      document.body.appendChild(script);
    }
  }, [showAds]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay Background */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black backdrop-blur-md z-40"
            onClick={onClose}
          />

          {/* Sidebar Panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            ref={sidebarRef}
            className="fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-yellow-500 to-yellow-400 text-gray-900 shadow-lg p-6 z-50"
          >
            {/* Close Button */}
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 text-gray-900 hover:text-gray-800 transition"
            >
              <FaTimes className="text-2xl" />
            </button>

            {/* Sidebar Content */}
            <h3 className="text-xl font-bold mb-4">Dashboard Navigation</h3>
            <div className="space-y-4">
              
              {/* Dashboard Home */}
              <div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                    <FaHome /> Dashboard Home
                  </li>
                </ul>
              </div>

              {/* Student Section (Only for Students) */}
              {userRole === "student" && (
                <>
                  <div>
                    <h4 className="font-bold text-lg mb-2">Learning</h4>
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
                </>
              )}

              {/* Instructor Section (Only for Instructors) */}
              {userRole === "instructor" && (
                <>
                  <div>
                    <h4 className="font-bold text-lg mb-2">Instructor</h4>
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
                </>
              )}

              {/* Admin Section (Only for Admins) */}
              {userRole === "admin" && (
                <>
                  <div>
                    <h4 className="font-bold text-lg mb-2">Admin Panel</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                        <FaUserShield /> User Management
                      </li>
                      <li className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                        <FaCheckCircle /> Course Approvals
                      </li>
                    </ul>
                  </div>
                </>
              )}

              {/* Marketplace */}
              <div>
                <h4 className="font-bold text-lg mb-2">Marketplace</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                    <FaStore /> Learning Marketplace
                  </li>
                  <li className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                    <FaDollarSign /> NFT Marketplace
                  </li>
                </ul>
              </div>

              {/* Google AdSense Ads (If Enabled) */}
              {showAds && (
                <div className="mt-6 p-3 bg-white text-gray-900 shadow-lg rounded-lg">
                  <h4 className="text-lg font-bold mb-2 flex items-center gap-2">
                    <FaBullhorn /> Sponsored Ads
                  </h4>
                  <div className="text-center">
                    {/* Google AdSense Ad Slot */}
                    <ins className="adsbygoogle"
                      style={{ display: "block" }}
                      data-ad-client="ca-pub-xxxxxxxxxxxxxxxx"
                      data-ad-slot="1234567890"
                      data-ad-format="auto"
                      data-full-width-responsive="true">
                    </ins>
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
