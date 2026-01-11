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
import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "@/store/auth/authStore";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { FaCog } from "react-icons/fa";
import { toggleInstructorStatus } from "@/services/instructor/instructorService";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";
import useAppConfigStore from "@/store/appConfigStore";
import LinkText from "@/components/shared/LinkText";
import { adminNavLinks } from "@/components/dashboard/SidebarLinks/adminLinks";
import { instructorNavLinks } from "@/components/dashboard/SidebarLinks/instructorLinks";
import { studentNavLinks } from "@/components/dashboard/SidebarLinks/studentLinks";

export default function Header() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const memberships = useAuthStore((state) => state.memberships);
  const currentTenantId = useAuthStore((state) => state.currentTenantId);
  const switchTenant = useAuthStore((state) => state.switchTenant);
  const userRole = user?.role?.toLowerCase();
  const { t } = useTranslation("common");
  const { t: tDashboard } = useTranslation("dashboard");

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [available, setAvailable] = useState(user?.is_online ?? false);
  const [switchingTenantId, setSwitchingTenantId] = useState(null);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const msgRef = useRef(null);
  const searchContainerRef = useRef(null);
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
  const appSettings = useAppConfigStore((state) => state.settings);
  const fetchAppConfig = useAppConfigStore((state) => state.fetch);
  const router = useRouter();

  const profileLink =
    userRole === "superadmin" || userRole === "admin"
      ? "/dashboard/admin/profile/edit"
      : userRole
      ? `/dashboard/${userRole}/profile/edit`
      : "/profile/edit";

  const handleLogout = async () => {
    try {
      await logout();
      stopPolling();
      stopMessagePolling();
      toast.success(t('logged_out'));

      // ⏳ Delay before redirecting to login
      setTimeout(() => {
        router.push("/auth/login");
      }, 1200);
    } catch (err) {
      toast.error(t('logout_failed'));
    }
  };

  const handleTenantSwitch = async (tenantId) => {
    if (!tenantId || tenantId === currentTenantId) return;
    try {
      setSwitchingTenantId(tenantId);
      await switchTenant(tenantId);
      toast.success(
        t("tenant_switched", { defaultValue: "Tenant context updated." })
      );
      setDropdownOpen(false);
    } catch (err) {
      toast.error(
        t("tenant_switch_failed", {
          defaultValue: "Unable to switch tenant right now.",
        })
      );
    } finally {
      setSwitchingTenantId(null);
    }
  };

  const toggleDarkMode = () => {
    const newDark = !dark;
    setDark(newDark);
    document.documentElement.classList.toggle("dark", newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
  };

  const routeTitleMap = {
    "/dashboard/student": "titles.student_dashboard",
    "/dashboard/instructor": "titles.instructor_dashboard",
    "/dashboard/admin": "titles.admin_dashboard",
    "/dashboard/admin/settings/languages": "languagesPage.title",
    "/dashboard/admin/settings/languages/create": "languagesPage.create_title",
    "/dashboard/admin/settings/languages/edit/[code]": "languagesPage.edit_title",
  };

  const getPageTitle = () => {
    const { pathname, query } = router;
    const key = routeTitleMap[pathname];
    if (key) {
      return tDashboard(key, { code: query.code });
    }
    return t("dashboard");
  };

  const navItems = useMemo(() => {
    const translate = (key = "") => {
      if (!key) return "";
      return tDashboard(key, {
        defaultValue: key
          .replace(/_/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase()),
      });
    };

    const normalizedRole =
      userRole === "superadmin" ? "admin" : userRole || "student";
    const navMap = {
      admin: adminNavLinks,
      superadmin: adminNavLinks,
      instructor: instructorNavLinks,
      student: studentNavLinks,
    };

    const sections = navMap[normalizedRole] || studentNavLinks;
    const items = [];

    sections.forEach((section) => {
      const sectionLabel = translate(section.title);
      const sectionKey = section.title;

      (section.items || []).forEach((item) => {
        if (item?.isDropdown && Array.isArray(item.dropdown)) {
          const parentLabel = translate(item.label);
          const parentKey = item.label;
          item.dropdown.forEach((child) => {
            if (!child?.href || child.href === "#") return;
            items.push({
              id: `${sectionKey}-${parentKey}-${child.label}`,
              labelKey: child.label,
              label: translate(child.label),
              href: child.href,
              section: sectionLabel,
              sectionKey,
              parentLabel,
              parentKey,
            });
          });
          return;
        }

        if (!item?.href || item.href === "#") return;
        items.push({
          id: `${sectionKey}-${item.label}`,
          labelKey: item.label,
          label: translate(item.label),
          href: item.href,
          section: sectionLabel,
          sectionKey,
          parentLabel: null,
          parentKey: null,
        });
      });
    });

    const unique = [];
    const seen = new Set();
    items.forEach((item) => {
      const key = `${item.href}|${item.labelKey}`;
      if (seen.has(key)) return;
      seen.add(key);
      unique.push(item);
    });

    return unique;
  }, [userRole, tDashboard]);

  const matchingNavItems = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return [];

    return navItems.filter((item) => {
      const haystacks = [
        item.label,
        item.labelKey,
        item.section,
        item.sectionKey,
        item.parentLabel,
        item.parentKey,
        item.href,
      ]
        .filter(Boolean)
        .map((value) =>
          `${value}`.toLowerCase().replace(/_/g, " ").replace(/\s+/g, " ")
        );

      return haystacks.some((text) => text.includes(term));
    });
  }, [searchQuery, navItems]);

  const groupedNavResults = useMemo(() => {
    return matchingNavItems.reduce((acc, item) => {
      const group = item.section || t("dashboard");
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    }, {});
  }, [matchingNavItems, t]);

  const firstSearchResult = matchingNavItems[0] || null;
  const hasSearchResults = matchingNavItems.length > 0;

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      if (!firstSearchResult?.href) return;
      event.preventDefault();
      router.push(firstSearchResult.href);
      setSearchQuery("");
      setShowSearchResults(false);
    } else if (event.key === "Escape") {
      setShowSearchResults(false);
    }
  };

  const handleResultClick = (item) => {
    if (!item?.href) return;
    router.push(item.href);
    setSearchQuery("");
    setShowSearchResults(false);
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
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowSearchResults(false);
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
        <div className="relative hidden md:block" ref={searchContainerRef}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              const value = e.target.value;
              setSearchQuery(value);
              setShowSearchResults(Boolean(value.trim()));
            }}
            onFocus={() => {
              if (searchQuery.trim()) {
                setShowSearchResults(true);
              }
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder={t('search_placeholder')}
            className="pl-10 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500 dark:text-gray-300" />
          <AnimatePresence>
            {showSearchResults && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-96 max-h-80 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50"
              >
                {hasSearchResults ? (
                  Object.entries(groupedNavResults).map(([section, items]) => (
                    <div
                      key={section}
                      className="border-b border-gray-100 dark:border-gray-700 last:border-none"
                    >
                      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {section}
                      </div>
                      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                        {items.map((item) => (
                          <li key={item.id}>
                            <button
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => handleResultClick(item)}
                              className="w-full text-left px-4 py-3 hover:bg-yellow-50 dark:hover:bg-gray-700 transition"
                            >
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                  {item.label}
                                </span>
                                {item.parentLabel && (
                                  <span className="text-xs text-gray-500 dark:text-gray-300">
                                    {item.parentLabel}
                                  </span>
                                )}
                                <span className="text-[11px] text-yellow-600">
                                  {item.href}
                                </span>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-4 text-sm text-gray-500 dark:text-gray-300">
                    {t('no_results_found', {
                      defaultValue: `No matches for "${searchQuery.trim()}"`,
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
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
                const res = await toggleInstructorStatus(newStatus);
                const updated = res?.is_online ?? newStatus;
                setAvailable(updated);
                const setUser = useAuthStore.getState().setUser;
                setUser({ ...user, is_online: updated });
                toast.success(
                  updated
                    ? t('available_now')
                    : t('unavailable_now')
                );
              } catch (err) {
                toast.error(t('availability_update_failed'));
              }
            }}
            className={`px-3 py-1 rounded-full text-sm font-medium ${available ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}
          >
            {available ? t('available') : t('unavailable')}
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
                <h4 className="text-base font-semibold mb-2 border-b pb-1 px-4">{t('messages')}</h4>
                <ul className="text-sm text-gray-700 dark:text-gray-200 max-h-60 overflow-y-auto divide-y">
                  {messages.slice(0, 10).map((m) => (
                    <li
                      key={m.id}
                      className={`flex justify-between items-center px-4 py-2 transition ${
                        m.read
                          ? "text-gray-500 bg-gray-50 dark:bg-gray-700"
                          : "bg-yellow-50 dark:bg-gray-600"
                      }`}
                    >
                      <span className="mr-2 flex-1">{m.message}</span>
                      {!m.read ? (
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            await markMessageRead(m.id);
                          }}
                          className="ml-auto text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        >
                          {t('mark_as_read')}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">{t('read')}</span>
                      )}
                    </li>
                  ))}
                  {messages.length === 0 && (
                    <li className="px-4 py-2 text-center text-sm text-gray-500">
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
                      className={`flex justify-between items-center px-4 py-2 transition ${
                        n.read
                          ? "text-gray-500 bg-gray-50 dark:bg-gray-700"
                          : "bg-yellow-50 dark:bg-gray-600"
                      }`}
                    >
                      <LinkText text={n.message} />
                        {!n.read && (
                          <button
                            onClick={() => markRead(n.id)}
                            className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                          >
                            {t('mark_as_read')}
                          </button>
                        )}
                    </li>
                  ))}
                  {notifications.length === 0 && (
                    <li className="px-4 py-2 text-center text-sm text-gray-500">
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
            {user?.avatar_url && (
              <img
                src={
                  user.avatar_url.startsWith("http") ||
                  user.avatar_url.startsWith("blob:")
                    ? user.avatar_url
                    : `${process.env.NEXT_PUBLIC_API_BASE_URL}${user.avatar_url}`
                }
                alt="User Avatar"
                className="w-9 h-9 rounded-full border border-gray-300 shadow object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
            <div className="text-left hidden sm:block">
              <div className="text-sm font-medium text-gray-800 dark:text-white">
                {user?.full_name || t('guest')}
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
                    <span>{t('visit_website')}</span>
                  </li>
                  <li>
                    <Link
                      href={profileLink}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-yellow-50 dark:hover:bg-yellow-700 transition rounded-md"
                    >
                      <FaCog className="text-gray-500" />
                      <span>{t('edit_profile')}</span>
                    </Link>
                  </li>
                  {memberships?.length > 0 && (
                    <li className="px-3 py-2">
                      <div className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">
                        {t("tenant_switcher", {
                          defaultValue: "Tenant",
                        })}
                      </div>
                      <div className="flex flex-col gap-2">
                        {memberships.map((membership) => {
                          const label =
                            membership.tenant_name ||
                            membership.tenant_slug ||
                            membership.tenant_id;
                          const isActive =
                            membership.tenant_id === currentTenantId;
                          return (
                            <button
                              key={membership.tenant_id}
                              type="button"
                              onClick={() => handleTenantSwitch(membership.tenant_id)}
                              disabled={switchingTenantId === membership.tenant_id}
                              className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition ${
                                isActive
                                  ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30"
                                  : "border-transparent hover:border-yellow-200 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                  {label}
                                </span>
                                <span className="text-[11px] text-gray-400">
                                  {membership.role}
                                </span>
                              </div>
                              <span className="text-[11px] font-semibold text-yellow-600">
                                {isActive
                                  ? t("active", { defaultValue: "Active" })
                                  : t("switch", { defaultValue: "Switch" })}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </li>
                  )}
                  <li
                    className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-700 text-red-600 dark:text-red-400"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('logout')}</span>
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
