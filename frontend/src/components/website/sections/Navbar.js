// 📁 components/website/sections/Navbar.js
import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
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
import api from "@/services/api/api";
import { getCurrencies } from "@/services/currencyService";

const fetcher = (url) => api.get(url).then((res) => res.data.data);
const currencyFetcher = () => getCurrencies();

// ✅ Assets
import logo from "@/shared/assets/images/login/logo.png";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { useTranslation } from "next-i18next";
import { mutate } from "swr";

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Separate refs for each dropdown to avoid conflicts
  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const messageRef = useRef(null);
  const languageRef = useRef(null);
  const cartRef = useRef(null);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const appSettings = useAppConfigStore((state) => state.settings);
  const fetchAppConfig = useAppConfigStore((state) => state.fetch);

  const { profile, fetchProfile, clearAdmin } = useAdminStore();
  const router = useRouter();
  const userRole = user?.role?.toLowerCase();

  const { items: cartItems, fetchCart, clearCart } = useCartStore();

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

  const { i18n, t } = useTranslation("common");
  const { data: langs } = useSWR("/languages", fetcher);
  const { data: currencies } = useSWR("/currencies", currencyFetcher);
  const currentLang = langs?.find((l) => l.code === i18n.language);
  const currentCurrency = currencies?.find((c) => c.is_default) || currencies?.[0];
  const changeLang = async (lng) => {
    try {
      await i18n.changeLanguage(lng);
      if (typeof window !== "undefined") {
        localStorage.setItem("lng", lng);
      }
      // Reload the current route with the selected locale so that
      // server-side translations are properly loaded
      await router.push(router.asPath, router.asPath, { locale: lng });
      mutate("/languages");
      const selected = langs?.find((l) => l.code === lng);
      toast.success(
        selected ? t('language_changed_to', { name: selected.name }) : t('language_changed')
      );
    } catch (_) {
      toast.error(t('language_change_failed'));
    } finally {
      setLanguageOpen(false);
    }
  };

  useEffect(() => {
    fetchAppConfig();
  }, [fetchAppConfig]);

  useEffect(() => {
    if (user?.role === "SuperAdmin" && !profile) fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    if (user.profile_complete === false) {
      const profilePaths = {
        admin: "/dashboard/admin/profile/edit",
        instructor: "/dashboard/instructor/profile/edit",
        student: "/dashboard/student/profile/edit",
        superadmin: "/dashboard/admin/profile/edit",
      };
      const rolePath = profilePaths[userRole];
      if (rolePath && router.pathname !== rolePath) {
        router.replace(rolePath);
        toast.info(t('please_complete_profile'));
      }
    } else if (!user.is_email_verified && router.pathname !== "/auth/verify-email") {
      router.replace("/auth/verify-email");
      toast.info(t('please_verify_email', { defaultValue: "Please verify your email to continue." }));
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
    if (user) {
      fetchCart();
    } else {
      clearCart();
    }
  }, [user, fetchCart, clearCart]);

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
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
      if (messageRef.current && !messageRef.current.contains(event.target)) {
        setMessageOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setLanguageOpen(false);
      }
      if (cartRef.current && !cartRef.current.contains(event.target)) {
        setCartOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const profileLink =
    userRole === "superadmin" || userRole === "admin"
      ? "/dashboard/admin/profile/edit"
      : userRole
      ? `/dashboard/${userRole}/profile/edit`
      : "/profile/edit";

  const getAvatarUrl = (avatar) => {
    if (!avatar) return "";
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
                onClick={() => {
                  setNotificationOpen(false);
                  setMessageOpen(!messageOpen);
                }}
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
                  ref={messageRef}
                  className="absolute left-0 mt-2 bg-white text-gray-800 w-72 rounded-xl shadow-xl border border-gray-200 p-4 z-50"
                >
                  <h4 className="text-base font-semibold mb-2 border-b pb-1">
                    {t('messages')}
                  </h4>
                  <ul className="space-y-3 text-sm max-h-60 overflow-y-auto">
                    {messages.slice(0, 10).map((msg) => (
                      <li
                        key={msg.id}
                        className={`flex justify-between items-center p-2 rounded-md transition ${
                          msg.read ? "text-gray-400 bg-gray-50" : "bg-yellow-50"
                        }`}
                      >
                        <span className="mr-2 flex-1">{msg.message}</span>
                        {!msg.read ? (
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              await markMessageRead(msg.id);
                            }}
                            className="ml-auto text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                          >
                            {t('mark_as_read', 'Mark as Read')}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Read</span>
                        )}
                      </li>
                    ))}
                    {messages.length === 0 && (
                      <li className="text-center text-sm text-gray-500 py-2">
                        {t('no_messages')}
                      </li>
                    )}
                  </ul>
                  <div className="mt-2 text-center">
                    <Link
                      href="/messages"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {t('view_all')}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.1 }}
                onClick={() => {
                  setMessageOpen(false);
                  setNotificationOpen(!notificationOpen);
                }}
                className="relative text-2xl"
              >
                <FaBell />

                <span className="absolute -top-1 -right-1 bg-red-500 text-xs px-2 rounded-full text-white">
                  {unreadCount}
                </span>
              </motion.button>

              {notificationOpen && (
                <div
                  ref={notificationRef}
                  className="absolute left-0 mt-2 bg-white text-gray-800 w-72 rounded-xl shadow-xl border border-gray-200 p-4 z-50"
                >
                  <h4 className="text-base font-semibold mb-2 border-b pb-1">
                    {t('notifications')}
                  </h4>
                  <ul className="space-y-3 text-sm max-h-60 overflow-y-auto">
                    {notifications.slice(0, 10).map((note) => (
                      <li
                        key={note.id}
                        className={`flex justify-between items-center p-2 rounded-md transition ${
                          note.read
                            ? "text-gray-400 bg-gray-50"
                            : "bg-yellow-50"
                        }`}
                      >
                        <span><LinkText text={note.message} /></span>
                        {!note.read && (
                          <button
                            onClick={() => markRead(note.id)}
                            className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                          >
                            {t('mark_as_read', 'Mark as Read')}
                          </button>
                        )}
                      </li>
                    ))}
                    {notifications.length === 0 && (
                      <li className="text-center text-sm text-gray-500 py-2">
                        {t('no_notifications')}
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
                      {t('view_all')}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <span className="text-sm font-semibold hidden md:inline">
              {t('welcome_user', { name: user.full_name?.split(' ')[0] })}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center space-x-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          onClick={() => {
            setMessageOpen(false);
            setNotificationOpen(false);
            setDropdownOpen(false);
            setLanguageOpen(!languageOpen);
          }}
          className="w-8 h-8 rounded-full overflow-hidden border border-gray-300 flex items-center justify-center"
        >
          <img
            src={
              currentLang?.icon_url
                ? `${API_BASE_URL}${currentLang.icon_url}`
                : "/flags/default.png"
            }
            alt={currentLang ? currentLang.name : 'language'}
            className="w-full h-full object-cover"
          />
        </motion.button>

        {currentCurrency && (
          <div className="flex items-center gap-1 text-sm">
            <img
              src={`https://flagcdn.com/24x18/${currentCurrency.code
                .slice(0, 2)
                .toLowerCase()}.png`}
              onError={(e) => (e.target.src = "/flags/default.png")}
              alt={currentCurrency.code}
              className="w-5 h-3 border rounded"
            />
            <span className="font-semibold">{currentCurrency.code}</span>
          </div>
        )}

        {userRole && (
          <Link
            href={
              userRole
                ? userRole === "superadmin" || userRole === "admin"
                  ? "/dashboard/admin"
                  : `/dashboard/${userRole}`
                : "/dashboard"
            }
            className="flex items-center gap-2 font-semibold hover:underline"
          >
            <FaTachometerAlt /> {t('dashboard')}
          </Link>
        )}
        {user ? (
          <>
        <motion.button
          whileHover={{ scale: 1.1 }}
          onClick={() => {
            setMessageOpen(false);
            setNotificationOpen(false);
            setDropdownOpen(false);
            setLanguageOpen(false);
            setCartOpen(!cartOpen);
          }}
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
            onClick={() => {
              setMessageOpen(false);
              setNotificationOpen(false);
              setDropdownOpen(!dropdownOpen);
            }}
              className="w-12 h-12 rounded-full border-4 border-yellow-400 overflow-hidden shadow-lg flex items-center justify-center bg-white"
            >
              {user.avatar_url && (
                <img
                  src={getAvatarUrl(user.avatar_url)}
                  alt="Avatar"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
            </motion.button>

            {dropdownOpen && (
              <div
                ref={profileRef}
                className="absolute right-6 top-20 bg-white text-gray-800 w-60 rounded-2xl shadow-xl p-4 z-50 border border-gray-200"
              >
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link
                      href={profileLink}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition rounded-md"
                    >
                      <FaCog className="text-gray-500" />
                      <span>{t('edit_profile')}</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/profile/change-password"
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition rounded-md"
                    >
                      <FaLock className="text-gray-500" />
                      <span>{t('change_password')}</span>
                    </Link>
                  </li>
                  {userRole === 'student' && (
                    <li>
                      <Link
                        href="/dashboard/student/wishlist"
                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition rounded-md"
                      >
                        <FaHeart className="text-gray-500" />
                        <span>{t('wishlist')}</span>
                      </Link>
                    </li>
                  )}
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
                          toast.success(t('logged_out'));

                          // ⏳ Delay before redirect
                          setTimeout(() => {
                            router.push("/auth/login");
                          }, 1200);
                        } catch (err) {
                          toast.error(t('logout_failed'));
                        }
                      }}
                      className="flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 transition rounded-md w-full text-left"
                    >
                      <FaSignOutAlt className="text-red-500" />
                      <span>{t('logout')}</span>
                    </button>
                  </li>
                </ul>
              </div>
            )}

            {languageOpen && (
              <div
                ref={languageRef}
                className="absolute top-20 right-24 bg-white text-gray-800 w-48 rounded-xl shadow-xl border border-gray-200 p-2 z-50"
              >
                <LanguageSwitcher changeLang={changeLang} />
              </div>
            )}

            {cartOpen && (
              <div
                ref={cartRef}
                className="absolute top-20 right-36 bg-white text-gray-800 w-64 rounded-xl shadow-xl border border-gray-200 p-4 z-50"
              >
                <h4 className="text-base font-semibold mb-2 border-b pb-1">
                  {t('your_cart')}
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
                    {t('view_cart')}
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
              <FaSignInAlt /> {t('login')}
            </Link>
            <Link
              href="/auth/register"
              className="flex items-center gap-2 font-semibold hover:underline"
            >
              <FaUserPlus /> {t('register')}
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
