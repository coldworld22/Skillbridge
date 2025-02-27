import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBell, FaEnvelope, FaGlobe, FaShoppingCart, FaUserCircle, FaCog,
  FaLock, FaSignOutAlt, FaLanguage
} from "react-icons/fa";

// ✅ Import Logo & Flags
import login from "@/shared/assets/images/login/logo.png";
import usFlag from "@/shared/assets/images/home/us.png";
import franceFlag from "@/shared/assets/images/home/france.png";
import saudiFlag from "@/shared/assets/images/home/saudia.png";
import ukFlag from "@/shared/assets/images/home/british.png";
import germanyFlag from "@/shared/assets/images/home/german.png";
import italyFlag from "@/shared/assets/images/home/italy.png";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([
    { id: 1, name: "Premium Course", price: "$50", link: "/cart" },
    { id: 2, name: "E-Book", price: "$20", link: "/cart" }
  ]);
  const [unreadMessages, setUnreadMessages] = useState([
    { id: 1, text: "New message from Instructor", link: "/messages" },
    { id: 2, text: "Course reminder", link: "/messages" }
  ]);
  const [unreadNotifications, setUnreadNotifications] = useState([
    { id: 1, text: "Assignment due soon", link: "/notifications" },
    { id: 2, text: "Live class starts in 30 min", link: "/notifications" }
  ]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  // Handle Scroll Change
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Progress Bar on First Page Load
  useEffect(() => {
    let progressInterval = setInterval(() => {
      setLoading((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => setLoading(false), 500);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
    return () => clearInterval(progressInterval);
  }, []);

  // Close Dropdowns When Clicking Outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
        setNotificationOpen(false);
        setMessageOpen(false);
        setLanguageOpen(false);
        setLocationOpen(false);
        setCartOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 w-full p-4 flex justify-between items-center shadow-lg z-50 bg-yellow-500 text-gray-900">


      {/* Progress Bar */}
      {loading && (
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 3, ease: "easeInOut" }}
          className="absolute top-0 left-0 h-1 bg-yellow-700"
        />
      )}

      {/* Left Section (Logo + Messages + Notifications) */}
      <div className="flex items-center space-x-6">
        {/* Logo */}
        <Link href="/">
          <div className="w-14 h-14 rounded-full border-4 border-gray-800 flex items-center justify-center shadow-lg bg-gray-800 cursor-pointer">
            <Image src={login} alt="SkillBridge Logo" width={45} height={45} className="rounded-full" />
          </div>
        </Link>

        {/* Messages Dropdown */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={() => setMessageOpen(!messageOpen)}
            className="relative text-2xl hover:text-yellow-400 transition"
          >
            <FaEnvelope />
            {unreadMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadMessages.length}
              </span>
            )}
          </motion.button>
          <AnimatePresence>
            {messageOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-0 mt-2 bg-white text-gray-900 w-64 shadow-xl rounded-lg p-4 border"
              >
                {unreadMessages.map((msg) => (
                  <Link key={msg.id} href="/website/pages/messages" className="block p-2 hover:bg-gray-200 rounded">
                    {msg.text}
                  </Link>

                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        {/* Notifications Dropdown */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="relative text-2xl hover:text-gray-900 transition"
          >
            <FaBell />
            {unreadNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadNotifications.length}
              </span>
            )}
          </motion.button>
          <AnimatePresence>
            {notificationOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-0 mt-2 bg-yellow-100 text-gray-900 w-64 shadow-xl rounded-lg p-4 border"
              >
                {unreadNotifications.map((notif) => (
                  <Link key={notif.id} href="/website/pages/notifications" className="block p-2 hover:bg-gray-200 rounded">
                    {notif.text}
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>


      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-6">

        {/* Language Dropdown */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={() => setLanguageOpen(!languageOpen)}
            className="text-2xl hover:text-yellow-400 transition"
          >
            <FaLanguage />
          </motion.button>

          <AnimatePresence>
            {languageOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 bg-white text-gray-900 w-40 shadow-xl rounded-lg p-4 border"
              >
                <ul className="grid grid-cols-2 gap-2">
                  <li className="flex justify-center p-2 hover:bg-gray-200 cursor-pointer">
                    <Image src={usFlag} alt="English" width={30} height={20} />
                  </li>
                  <li className="flex justify-center p-2 hover:bg-gray-200 cursor-pointer">
                    <Image src={franceFlag} alt="French" width={30} height={20} />
                  </li>
                  <li className="flex justify-center p-2 hover:bg-gray-200 cursor-pointer">
                    <Image src={germanyFlag} alt="German" width={30} height={20} />
                  </li>
                  <li className="flex justify-center p-2 hover:bg-gray-200 cursor-pointer">
                    <Image src={saudiFlag} alt="Arabic" width={30} height={20} />
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Location Selector */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={() => setLocationOpen(!locationOpen)}
            className="text-2xl hover:text-yellow-400 transition"
          >
            <FaGlobe />
          </motion.button>

          <AnimatePresence>
            {locationOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 bg-white text-gray-900 w-40 shadow-xl rounded-lg p-4 border"
              >
                <ul className="grid grid-cols-2 gap-2">
                  <li className="flex justify-center p-2 hover:bg-gray-200 cursor-pointer">
                    <Image src={usFlag} alt="USA" width={30} height={20} />
                  </li>
                  <li className="flex justify-center p-2 hover:bg-gray-200 cursor-pointer">
                    <Image src={ukFlag} alt="UK" width={30} height={20} />
                  </li>
                  <li className="flex justify-center p-2 hover:bg-gray-200 cursor-pointer">
                    <Image src={saudiFlag} alt="Saudi Arabia" width={30} height={20} />
                  </li>
                  <li className="flex justify-center p-2 hover:bg-gray-200 cursor-pointer">
                    <Image src={italyFlag} alt="Italy" width={30} height={20} />
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        {/* Cart Dropdown */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={() => setCartOpen(!cartOpen)}
            className="relative text-2xl hover:text-yellow-400 transition"
          >
            <FaShoppingCart />
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {cartItems.length}
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {cartOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 bg-white text-gray-900 w-64 shadow-xl rounded-lg p-4 border"
              >
                {cartItems.map((item) => (
                  <Link key={item.id} href={item.link} className="block p-2 hover:bg-gray-200 rounded flex justify-between">
                    <span>{item.name}</span>
                    <span className="text-yellow-600">{item.price}</span>
                  </Link>
                ))}
                <Link href="/website/pages/cart">
                  <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded mt-2">
                    Go to Cart
                  </button>
                </Link>

              </motion.div>
            )}
          </AnimatePresence>
        </div>


        {/* Profile Dropdown */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-12 h-12 rounded-full border-4 border-yellow-400 flex items-center justify-center shadow-lg"
          >
            <FaUserCircle className="relative text-2xl hover:text-yellow-400 transition" />
          </motion.button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 bg-white text-gray-900 w-48 shadow-xl rounded-lg overflow-hidden border"
              >
                <ul>
                  <li>
                    <Link href="/website/pages/profile/edit" className="flex items-center gap-2 p-3 hover:bg-gray-200 rounded-md cursor-pointer transition">
                      <FaCog /> Edit Profile
                    </Link>
                  </li>
                  <li>
                    <Link href="/website/pages/profile/change-password" className="flex items-center gap-2 p-3 hover:bg-gray-200 rounded-md cursor-pointer transition">
                      <FaLock /> Change Password
                    </Link>
                  </li>
                  <li>
                    <Link href="/auth/logout" className="flex items-center gap-2 p-3 text-red-500 hover:bg-red-100 rounded-md cursor-pointer transition">
                      <FaSignOutAlt /> Logout
                    </Link>
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>



      </div>
    </nav>
  );
};

export default Navbar;
