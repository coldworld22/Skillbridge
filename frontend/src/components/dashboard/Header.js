import { Bell, ChevronDown, Mail, Moon, Sun, Search } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const router = useRouter();

  const handleLogout = () => {
    router.push('/auth/login');
  };

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setDark(!dark);
  };

  // Extract page title from route
  const getPageTitle = () => {
    const slug = router.pathname.split('/').pop();
    if (!slug || slug === 'index') return 'Dashboard';
    return slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-30">
      {/* Page Title */}
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">
        {getPageTitle()}
      </h1>

      {/* Right Section */}
      <div className="flex items-center gap-4 sm:gap-6 relative">
        {/* Search Input */}
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

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="text-gray-500 hover:text-yellow-500 transition"
        >
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Messages */}
        <div className="relative group cursor-pointer">
          <Mail className="w-6 h-6 text-gray-500 dark:text-gray-300 hover:text-yellow-500 transition duration-200" />
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">5</span>
        </div>

        {/* Notifications */}
        <div className="relative group cursor-pointer" ref={notifRef}>
          <Bell
            className="w-6 h-6 text-gray-500 dark:text-gray-300 hover:text-yellow-500 transition duration-200"
            onClick={() => setNotifOpen(!notifOpen)}
          />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>

          {/* Notification Dropdown */}
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
                  <li className="px-4 py-2">🔔 New user registered</li>
                  <li className="px-4 py-2">💬 You have 2 new messages</li>
                  <li className="px-4 py-2">⚙️ Settings updated</li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Avatar */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <img
              src="/images/logo.png"
              alt="User Avatar"
              className="w-9 h-9 rounded-full border border-gray-300 shadow"
            />
            <div className="text-left hidden sm:block">
              <div className="text-sm font-medium text-gray-800 dark:text-white">John Doe</div>
              <div className="text-xs text-gray-500 dark:text-gray-300">
                <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Admin</span>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-yellow-500 transition" />
          </button>

          {/* Dropdown */}
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
                  <li className="hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-2 cursor-pointer" onClick={() => router.push('/profile')}>View Profile</li>
                  <li className="hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-2 cursor-pointer" onClick={() => router.push('/profile/edit')}>Edit Profile</li>
                  <li className="hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-2 cursor-pointer" onClick={handleLogout}>Logout</li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
