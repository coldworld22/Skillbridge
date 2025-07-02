// 📁 components/website/sections/Navbar.js
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  FaBell,
  FaEnvelope,
  FaGlobe,
  FaShoppingCart,
  FaUserCircle,
  FaCog,
  FaLock,
  FaSignOutAlt,
  FaLanguage,
  FaSignInAlt,
  FaUserPlus,
  FaHeart,
  FaThumbsUp,
  FaTachometerAlt,
} from "react-icons/fa";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

import useAuthStore from "@/store/auth/authStore";
import useAdminStore from "@/store/admin/adminStore";
import { API_BASE_URL } from "@/config/config";
import useCartStore from "@/store/cart/cartStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";
import LinkText from "@/components/shared/LinkText";
import useAppConfigStore from "@/store/appConfigStore";

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
  const appSettings = useAppConfigStore((state) => state.settings);
  const fetchAppConfig = useAppConfigStore((state) => state.fetch);

  const { profile, fetchProfile, clearAdmin } = useAdminStore();
  const router = useRouter();
  const userRole = user?.role?.toLowerCase();

  const { items: cartItems, fetchCart } = useCartStore();

  const notifications = useNotificationStore((state) => state.items);
  const fetchNotifications = useNotificationStore((state) => state.fetch);

  const startPolling = useNotificationStore((state) => state.startPolling);

  const markRead = useNotificationStore((state) => state.markRead);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const messages = useMessageStore((state) => state.items);
  const fetchMessages = useMessageStore((state) => state.fetch);
  const startMessagePolling = useMessageStore((state) => state.startPolling);
  const markMessageRead = useMessageStore((state) => state.markRead);
  const unreadMessages = messages.filter((m) => !m.read);

  useEffect(() => {
    fetchAppConfig();
  }, [fetchAppConfig]);

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
    fetchCart();
  }, [user, fetchCart]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      startPolling();
      fetchMessages();
      startMessagePolling();
    }
  }, [
    user,
    fetchNotifications,
    startPolling,
    fetchMessages,
    startMessagePolling,
  ]);

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
          <div className="w-14 h-14 rounded-full border-4 border-gray-800 flex items-center justify-center shadow-lg bg-gray-800 cursor-pointer overflow-hidden">
            <img
              src={appSettings.logo_url ? `${API_BASE_URL}${appSettings.logo_url}` : logo.src || logo}
              alt={`${appSettings.appName || 'SkillBridge'} Logo`}
              width={45}
              height={45}
              className="rounded-full object-contain"
            />
          </div>
        </Link>

        {user && (
          <>
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.1 }}
                onClick={() => setMessageOpen(!messageOpen)}
                className="relative text-2xl"
              >
                <FaEnvelope />
                {unreadMessages.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-xs px-2 rounded-full text-white">
                    {unreadMessages.length}
                  </span>
                )}
              </motion.button>

              {messageOpen && (
                <div
                  ref={dropdownRef}
                  className="absolute left-0 mt-2 bg-white text-gray-800 w-72 rounded-xl shadow-xl border border-gray-200 p-4 z-50"
                >
                  <h4 className="text-base font-semibold mb-2 border-b pb-1">
                    Messages
                  </h4>
                  <ul className="space-y-3 text-sm max-h-60 overflow-y-auto">
                    {messages.slice(0, 10).map((msg) => (
                      <li
                        key={msg.id}
                        onClick={() => markMessageRead(msg.id)}
                        className={`flex justify-between items-center p-2 rounded-md cursor-pointer transition ${
                          msg.read ? "text-gray-400 bg-gray-50" : "bg-yellow-50"
                        }`}
                      >
                        <span>{msg.message}</span>
                        {!msg.read && (
                          <span className="ml-2 text-xs text-red-500">new</span>
                        )}
                      </li>
                    ))}
                    {messages.length === 0 && (
                      <li className="text-center text-sm text-gray-500 py-2">
                        No messages
                      </li>
                    )}
                  </ul>
                  <div className="mt-2 text-center">
                    <Link
                      href="/messages"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View All
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.1 }}
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative text-2xl"
              >
                <FaBell />

                <span className="absolute -top-1 -right-1 bg-red-500 text-xs px-2 rounded-full text-white">
                  {unreadCount}
                </span>
              </motion.button>

              {notificationOpen && (
                <div
                  ref={dropdownRef}
                  className="absolute left-0 mt-2 bg-white text-gray-800 w-72 rounded-xl shadow-xl border border-gray-200 p-4 z-50"
                >
                  <h4 className="text-base font-semibold mb-2 border-b pb-1">
                    Notifications
                  </h4>
                  <ul className="space-y-3 text-sm max-h-60 overflow-y-auto">
                    {notifications.slice(0, 10).map((note) => (
                      <li
                        key={note.id}
                        onClick={() => markRead(note.id)}
                        className={`flex justify-between items-center p-2 rounded-md cursor-pointer transition ${
                          note.read
                            ? "text-gray-400 bg-gray-50"
                            : "bg-yellow-50"
                        }`}
                      >
                        <span><LinkText text={note.message} /></span>
                        {!note.read && (
                          <span className="ml-2 text-xs text-red-500">new</span>
                        )}
                      </li>
                    ))}
                    {notifications.length === 0 && (
                      <li className="text-center text-sm text-gray-500 py-2">
                        No notifications
                      </li>
                    )}
                  </ul>
                  <div className="mt-2 text-center">
                    <Link
                      href={
                        userRole
                          ? userRole === "superadmin"
                            ? "/dashboard/admin/notifications"
                            : `/dashboard/${userRole}/notifications`
                          : "/notifications"
                      }
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View All
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <span className="text-sm font-semibold hidden md:inline">
              Welcome, {user.full_name?.split(" ")[0]}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center space-x-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          onClick={() => setLanguageOpen(!languageOpen)}
          className="text-2xl"
        >
          <FaLanguage />
        </motion.button>

        {user && (
          <Link
            href={
              userRole === "superadmin" || userRole === "admin"
                ? "/dashboard/admin"
                : `/dashboard/${userRole}`
            }
            className="flex items-center gap-2 font-semibold hover:underline"
          >
            <FaTachometerAlt /> Dashboard
          </Link>
        )}

        {user ? (
          <>
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => setCartOpen(!cartOpen)}
              className="relative text-2xl"
            >
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
              <div
                ref={dropdownRef}
                className="absolute right-6 top-20 bg-white text-gray-800 w-60 rounded-2xl shadow-xl p-4 z-50 border border-gray-200"
              >
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
                    <Link
                      href="/profile/change-password"
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition rounded-md"
                    >
                      <FaLock className="text-gray-500" />
                      <span>Change Password</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/student/wishlist"
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition rounded-md"
                    >
                      <FaHeart className="text-gray-500" />
                      <span>Wishlist</span>
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
                    <Image
                      src={usFlag}
                      alt="EN"
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                    English
                  </li>
                  <li className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded-md">
                    <Image
                      src={saudiFlag}
                      alt="AR"
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                    Arabic
                  </li>
                </ul>
              </div>
            )}

            {cartOpen && (
              <div className="absolute top-20 right-36 bg-white text-gray-800 w-64 rounded-xl shadow-xl border border-gray-200 p-4 z-50">
                <h4 className="text-base font-semibold mb-2 border-b pb-1">
                  Your Cart
                </h4>
                <ul className="space-y-3 text-sm">
                  {cartItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex justify-between items-center hover:bg-gray-50 p-2 rounded-md"
                    >
                      <span>{item.name}</span>
                      <span className="font-semibold">{item.price}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 text-center">
                  <Link
                    href="/cart"
                    className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-4 py-2 rounded-md transition"
                  >
                    View Cart
                  </Link>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <Link
              href="/auth/login"
              className="flex items-center gap-2 font-semibold hover:underline"
            >
              <FaSignInAlt /> Login
            </Link>
            <Link
              href="/auth/register"
              className="flex items-center gap-2 font-semibold hover:underline"
            >
              <FaUserPlus /> Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
