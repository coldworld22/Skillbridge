import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBookOpen, FaChalkboardTeacher, FaComments, FaHeadset, FaChevronDown,
  FaFileAlt, FaGraduationCap, FaUsers, FaCog, FaStar, FaGift
} from "react-icons/fa";
import styles from "./CurtainMenu.module.scss";

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
    <div ref={curtainRef} className={styles.wrapper}>
      {/* Curtain Handle (Pull to Open/Close) */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: isOpen ? 5 : 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`${styles.toggle} animate-pulse`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <motion.div
          animate={{ y: isOpen ? 0 : [0, -3, 0] }}
          transition={{ repeat: isOpen ? 0 : Infinity, duration: 1.5 }}
          style={{ color: "#22c55e", fontSize: "1.25rem" }}
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
            className={styles.panel}
          >
            <div className={styles.grid}>
              {/* Left Section */}
              <div>
                <h3 className={styles.heading}>Learning</h3>
                <ul className={styles.list}>
                  <li className={styles.item}>
                    <FaBookOpen /> Courses
                  </li>
                  <li className={styles.item}>
                    <FaChalkboardTeacher /> Instructors
                  </li>
                  <li className={styles.item}>
                    <FaGraduationCap /> Certificates
                  </li>
                </ul>
              </div>

              {/* Middle Section */}
              <div>
                <h3 className={styles.heading}>Community</h3>
                <ul className={styles.list}>
                  <li className={styles.item}>
                    <FaUsers /> Student Hub
                  </li>
                  <li className={styles.item}>
                    <FaComments /> Discussion Forums
                  </li>
                  <li className={styles.item}>
                    <FaHeadset /> Help & Support
                  </li>
                </ul>
              </div>

              {/* Right Section */}
              <div>
                <h3 className={styles.heading}>Extras</h3>
                <ul className={styles.list}>
                  <li className={styles.item}>
                    <FaStar /> Featured Content
                  </li>
                  <li className={styles.item}>
                    <FaGift /> Rewards & Offers
                  </li>
                  <li className={styles.item}>
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
