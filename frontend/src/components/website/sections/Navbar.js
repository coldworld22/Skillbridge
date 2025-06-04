// 📁 components/website/sections/Navbar.js
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  FaBell, FaEnvelope, FaGlobe, FaShoppingCart, FaUserCircle, FaCog,
  FaLock, FaSignOutAlt, FaLanguage, FaSignInAlt, FaUserPlus
} from "react-icons/fa";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

import useAuthStore from "@/store/auth/authStore";
import useAdminStore from "@/store/admin/adminStore";
import { API_BASE_URL } from '@/config/config';

// ✅ Assets
import logo from "@/shared/assets/images/login/logo.png";
import usFlag from "@/shared/assets/images/home/us.png";
import saudiFlag from "@/shared/assets/images/home/saudia.png";

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const { profile, fetchProfile, clearAdmin } = useAdminStore();
  const router = useRouter();
  const userRole = user?.role?.toLowerCase();

  const cartItems = [
    { id: 1, name: "Premium Course", price: "$50", link: "/cart" },
    { id: 2, name: "E-Book", price: "$20", link: "/cart" }
  ];

  const unreadMessages = [
    { id: 1, text: "New message from Instructor", link: "/messages" },
    { id: 2, text: "Course reminder", link: "/messages" }
  ];

  const unreadNotifications = [
    { id: 1, text: "Assignment due soon", link: "/notifications" },
    { id: 2, text: "Live class starts in 30 min", link: "/notifications" }
  ];

  useEffect(() => {
    if (user?.role === "SuperAdmin" && !profile) fetchProfile();
  }, [user]);

  useEffect(() => {
    if (user && user.profile_complete === false) {
      const profilePaths = {
        admin: "/dashboard/admin/profile/edit",
        instructor: "/dashboard/instructor/profile/edit",
        student: "/dashboard/student/profile/edit",
      };
      const rolePath = profilePaths[userRole] || "/auth/login";
      if (router.pathname !== rolePath) {
        router.replace(rolePath);
        toast.info("Please complete your profile to continue.");
      }
    }
  }, [user, userRole, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoading((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setLoading(false), 500);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
        setNotificationOpen(false);
        setMessageOpen(false);
        setLanguageOpen(false);
        setCartOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const profileLink =
    userRole === "superadmin" || userRole === "admin"
      ? "/dashboard/admin/profile/edit"
      : `/dashboard/${userRole}/profile/edit`;

  const getAvatarUrl = (avatar) => {
    if (!avatar) return "/images/profile/user.png";
    if (avatar.startsWith("http") || avatar.startsWith("blob:")) return avatar;
    return `${API_BASE_URL}${avatar}`; // avatar starts with "/uploads/..."
  };




  return (
    <nav className="fixed top-0 w-full px-6 py-3 flex justify-between items-center shadow-lg z-50 bg-yellow-500 text-gray-900">
      {loading && (
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 3, ease: "easeInOut" }}
          className="absolute top-0 left-0 h-1 bg-yellow-700"
        />
      )}

      <div className="flex items-center space-x-6">
        <Link href="/">
          <div className="w-14 h-14 rounded-full border-4 border-gray-800 flex items-center justify-center shadow-lg bg-gray-800 cursor-pointer">
            <Image src={logo} alt="SkillBridge Logo" width={45} height={45} className="rounded-full" />
          </div>
        </Link>

        {user && (
          <>
            <motion.button whileHover={{ scale: 1.1 }} onClick={() => setMessageOpen(!messageOpen)} className="relative text-2xl">
              <FaEnvelope />
              {unreadMessages.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-xs px-2 rounded-full text-white">
                  {unreadMessages.length}
                </span>
              )}
            </motion.button>

            <motion.button whileHover={{ scale: 1.1 }} onClick={() => setNotificationOpen(!notificationOpen)} className="relative text-2xl">
              <FaBell />
              {unreadNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-xs px-2 rounded-full text-white">
                  {unreadNotifications.length}
                </span>
              )}
            </motion.button>

            <span className="text-sm font-semibold hidden md:inline">
              Welcome, {user.full_name?.split(" ")[0]}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center space-x-6">
        <motion.button whileHover={{ scale: 1.1 }} onClick={() => setLanguageOpen(!languageOpen)} className="text-2xl">
          <FaLanguage />
        </motion.button>

        {user ? (
          <>
            <motion.button whileHover={{ scale: 1.1 }} onClick={() => setCartOpen(!cartOpen)} className="relative text-2xl">
              <FaShoppingCart />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-xs px-2 rounded-full text-white">
                  {cartItems.length}
                </span>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-12 h-12 rounded-full border-4 border-yellow-400 overflow-hidden shadow-lg flex items-center justify-center bg-white"
            >
              <img
                src={getAvatarUrl(user.avatar_url)}
                alt="Avatar"
                width={48}
                height={48}
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/images/profile/user.png";
                }}
              />
            </motion.button>






            {dropdownOpen && (
              <div ref={dropdownRef} className="absolute right-6 top-20 bg-white text-gray-800 w-60 rounded-2xl shadow-xl p-4 z-50 border border-gray-200">
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link
                      href={profileLink}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition rounded-md"
                    >
                      <FaCog className="text-gray-500" />
                      <span>Edit Profile</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/profile/change-password" className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition rounded-md">
                      <FaLock className="text-gray-500" />
                      <span>Change Password</span>
                    </Link>
                  </li>
                  {userRole === "superadmin" && profile?.job_title && (
                    <li className="px-3 pt-1 text-xs text-gray-400 font-medium italic">
                      {profile.job_title}
                    </li>
                  )}
                  <li>
                    <button
                      onClick={async () => {
                        try {
                          await logout();
                          clearAdmin?.(); // optional safety if clearAdmin is undefined
                          toast.success("Logged out successfully");

                          // ⏳ Delay before redirect
                          setTimeout(() => {
                            router.push("/auth/login");
                          }, 1200);
                        } catch (err) {
                          toast.error("Logout failed. Please try again.");
                        }
                      }}
                      className="flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 transition rounded-md w-full text-left"
                    >
                      <FaSignOutAlt className="text-red-500" />
                      <span>Logout</span>
                    </button>
                  </li>

                </ul>
              </div>
            )}

            {languageOpen && (
              <div className="absolute top-20 right-24 bg-white text-gray-800 w-40 rounded-xl shadow-xl border border-gray-200 p-3 z-50">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded-md">
                    <Image src={usFlag} alt="EN" width={20} height={20} className="rounded-full" />
                    English
                  </li>
                  <li className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded-md">
                    <Image src={saudiFlag} alt="AR" width={20} height={20} className="rounded-full" />
                    Arabic
                  </li>
                </ul>
              </div>
            )}

            {cartOpen && (
              <div className="absolute top-20 right-36 bg-white text-gray-800 w-64 rounded-xl shadow-xl border border-gray-200 p-4 z-50">
                <h4 className="text-base font-semibold mb-2 border-b pb-1">Your Cart</h4>
                <ul className="space-y-3 text-sm">
                  {cartItems.map((item) => (
                    <li key={item.id} className="flex justify-between items-center hover:bg-gray-50 p-2 rounded-md">
                      <span>{item.name}</span>
                      <span className="font-semibold">{item.price}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 text-center">
                  <Link href="/cart" className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-4 py-2 rounded-md transition">
                    View Cart
                  </Link>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <Link href="/auth/login" className="flex items-center gap-2 font-semibold hover:underline">
              <FaSignInAlt /> Login
            </Link>
            <Link href="/auth/register" className="flex items-center gap-2 font-semibold hover:underline">
              <FaUserPlus /> Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
