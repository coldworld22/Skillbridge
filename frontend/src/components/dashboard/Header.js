import {
  Bell,
  ChevronDown,
  Mail,
  Moon,
  Sun,
  Search,
  Home,
  LogOut,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "@/store/auth/authStore";
import { toast } from "react-toastify";
import { FaCog } from "react-icons/fa";
import { toggleInstructorStatus } from "@/services/instructor/instructorService";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";

export default function Header() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const userRole = user?.role?.toLowerCase();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [available, setAvailable] = useState(user?.is_online ?? false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const msgRef = useRef(null);
  const notifications = useNotificationStore((state) => state.items);
  const fetchNotifications = useNotificationStore((state) => state.fetch);

  const startPolling = useNotificationStore((state) => state.startPolling);
  const stopPolling = useNotificationStore((state) => state.stopPolling);

  const markRead = useNotificationStore((state) => state.markRead);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const messages = useMessageStore((state) => state.items);
  const fetchMessages = useMessageStore((state) => state.fetch);
  const startMessagePolling = useMessageStore((state) => state.startPolling);
  const stopMessagePolling = useMessageStore((state) => state.stopPolling);
  const markMessageRead = useMessageStore((state) => state.markRead);
  const unreadMessageCount = messages.filter((m) => !m.read).length;
  const router = useRouter();

  const profileLink =
    userRole === "superadmin" || userRole === "admin"
      ? "/dashboard/admin/profile/edit"
      : `/dashboard/${userRole}/profile/edit`;

  const handleLogout = async () => {
    try {
      await logout();
      stopPolling();
      stopMessagePolling();
      console.log(
        'Polling after logout:',
        useNotificationStore.getState().poller,
        useMessageStore.getState().poller
      );
      toast.success("You’ve been logged out. See you soon!");

      // ⏳ Delay before redirecting to login
      setTimeout(() => {
        router.push("/auth/login");
      }, 1200);
    } catch (err) {
      toast.error("Logout failed. Please try again.");
    }
  };

  const toggleDarkMode = () => {
    const newDark = !dark;
    setDark(newDark);
    document.documentElement.classList.toggle("dark", newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
  };

  const getPageTitle = () => {
    const slug = router.pathname.split("/").pop();
    if (!slug || slug === "index") return "Dashboard";
    return slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }

    setAvailable(user?.is_online ?? false);

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
      if (msgRef.current && !msgRef.current.contains(event.target)) {
        setMsgOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [user]);

  // Stop polling when component unmounts
  useEffect(() => {
    return () => {
      stopPolling();
      stopMessagePolling();
      console.log(
        'Polling after unmount:',
        useNotificationStore.getState().poller,
        useMessageStore.getState().poller
      );
    };
  }, []);

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

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-4 sm:gap-6 relative">
        <div className="relative hidden md:block">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="pl-10 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500 dark:text-gray-300" />
        </div>

        <button
          onClick={toggleDarkMode}
          className="text-gray-500 hover:text-yellow-500 transition"
          aria-label="Toggle dark mode"
        >
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {userRole === "instructor" && (
          <button
            onClick={async () => {
              const newStatus = !available;
              try {
                await toggleInstructorStatus(newStatus);
                setAvailable(newStatus);
                const setUser = useAuthStore.getState().setUser;
                setUser({ ...user, is_online: newStatus });
                toast.success(
                  newStatus
                    ? "You are now available"
                    : "You are now unavailable",
                );
              } catch (err) {
                toast.error("Failed to update availability");
              }
            }}
            className={`px-3 py-1 rounded-full text-sm font-medium ${available ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}
          >
            {available ? "Available" : "Unavailable"}
          </button>
        )}

        <div className="relative group cursor-pointer" ref={msgRef}>
          <Mail
            className="w-6 h-6 text-gray-500 dark:text-gray-300 hover:text-yellow-500 transition duration-200"
            onClick={() => setNotifOpen(false) || setMsgOpen(!msgOpen)}
          />
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {unreadMessageCount}
          </span>

          <AnimatePresence>
            {msgOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
              >
                <h4 className="text-base font-semibold mb-2 border-b pb-1 px-4">Messages</h4>
                <ul className="text-sm text-gray-700 dark:text-gray-200 max-h-60 overflow-y-auto divide-y">
                  {messages.slice(0, 10).map((m) => (
                    <li
                      key={m.id}
                      onClick={() => markMessageRead(m.id)}
                      className={`px-4 py-2 cursor-pointer transition ${
                        m.read
                          ? "text-gray-500 bg-gray-50 dark:bg-gray-700"
                          : "bg-yellow-50 dark:bg-gray-600"
                      }`}
                    >
                      {m.message}
                    </li>
                  ))}
                  {messages.length === 0 && (
                    <li className="px-4 py-2 text-center text-sm text-gray-500">
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative group cursor-pointer" ref={notifRef}>
          <Bell
            className="w-6 h-6 text-gray-500 dark:text-gray-300 hover:text-yellow-500 transition duration-200"
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label="Toggle notifications"
          />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount}
          </span>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
              >
                <ul className="text-sm text-gray-700 dark:text-gray-200 max-h-60 overflow-y-auto divide-y">
                  {notifications.slice(0, 10).map((n) => (
                    <li
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`px-4 py-2 cursor-pointer transition ${
                        n.read
                          ? "text-gray-500 bg-gray-50 dark:bg-gray-700"
                          : "bg-yellow-50 dark:bg-gray-600"
                      }`}
                    >
                      {n.message}
                    </li>
                  ))}
                  {notifications.length === 0 && (
                    <li className="px-4 py-2 text-center text-sm text-gray-500">
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 cursor-pointer group"
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            <img
              src={
                user?.avatar_url
                  ? user.avatar_url.startsWith("http") ||
                    user.avatar_url.startsWith("blob:")
                    ? user.avatar_url
                    : `${process.env.NEXT_PUBLIC_API_BASE_URL}${user.avatar_url}`
                  : "/images/default-avatar.png"
              }
              alt="User Avatar"
              className="w-9 h-9 rounded-full border border-gray-300 shadow object-cover"
            />
            <div className="text-left hidden sm:block">
              <div className="text-sm font-medium text-gray-800 dark:text-white">
                {user?.full_name || "Guest"}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-300">
                <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                  {userRole?.toUpperCase() || "USER"}
                </span>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-yellow-500 transition" />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
              >
                <ul className="text-gray-700 dark:text-gray-200 text-sm">
                  <li
                    className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-700"
                    onClick={() => router.push("/website")}
                  >
                    <Home className="w-4 h-4 text-gray-500" />
                    <span>visit Website</span>
                  </li>
                  <li>
                    <Link
                      href={profileLink}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-yellow-50 dark:hover:bg-yellow-700 transition rounded-md"
                    >
                      <FaCog className="text-gray-500" />
                      <span>Edit Profile</span>
                    </Link>
                  </li>
                  <li
                    className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-700 text-red-600 dark:text-red-400"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
