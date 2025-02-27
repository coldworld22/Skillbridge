import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBookOpen, FaChalkboardTeacher, FaComments, FaHeadset, FaChevronDown,
  FaFileAlt, FaGraduationCap, FaUsers, FaCog, FaStar, FaGift
} from "react-icons/fa";

const CurtainMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const curtainRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (curtainRef.current && !curtainRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={curtainRef} className="relative w-full flex flex-col items-center">
      {/* Curtain Handle (Pull to Open/Close) */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: isOpen ? 5 : 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-gray-900 px-6 py-2 rounded-b-lg shadow-lg font-semibold cursor-pointer flex items-center gap-2 border border-yellow-600 hover:shadow-2xl hover:scale-105 transition-all 
        animate-pulse"
        onClick={() => setIsOpen(!isOpen)}
      >
        <motion.div
          animate={{ y: isOpen ? 0 : [0, -3, 0] }}
          transition={{ repeat: isOpen ? 0 : Infinity, duration: 1.5 }}
          className="text-2xl text-green-500" // ✅ Set to green success color
        >
          ⬇️
        </motion.div>
        {isOpen ? "Hide Menu" : "Helpful Links"}
      </motion.div>

      {/* Curtain Effect */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "300px", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute top-0 left-0 w-full bg-gradient-to-b from-yellow-500 to-yellow-400 text-gray-900 shadow-lg rounded-b-lg overflow-hidden backdrop-blur-md border border-yellow-300 p-6"
          >
            <div className="grid grid-cols-3 gap-6">
              {/* Left Section */}
              <div>
                <h3 className="font-bold text-lg mb-2">Learning</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                    <FaBookOpen /> Courses
                  </li>
                  <li className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                    <FaChalkboardTeacher /> Instructors
                  </li>
                  <li className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                    <FaGraduationCap /> Certificates
                  </li>
                </ul>
              </div>

              {/* Middle Section */}
              <div>
                <h3 className="font-bold text-lg mb-2">Community</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                    <FaUsers /> Student Hub
                  </li>
                  <li className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                    <FaComments /> Discussion Forums
                  </li>
                  <li className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                    <FaHeadset /> Help & Support
                  </li>
                </ul>
              </div>

              {/* Right Section */}
              <div>
                <h3 className="font-bold text-lg mb-2">Extras</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                    <FaStar /> Featured Content
                  </li>
                  <li className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                    <FaGift /> Rewards & Offers
                  </li>
                  <li className="flex items-center gap-3 p-2 hover:bg-yellow-600 rounded-lg cursor-pointer transition">
                    <FaCog /> Settings
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CurtainMenu;
