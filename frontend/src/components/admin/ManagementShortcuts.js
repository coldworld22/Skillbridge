// components/admin/ManagementShortcuts.js
import { FaBook, FaVideo, FaUserTie, FaUsers, FaCog, FaCreditCard } from "react-icons/fa";
import Link from "next/link";
import styles from "./AdminCards.module.scss";

const shortcuts = [
  { icon: <FaBook />, label: "Manage Tutorials", href: "/admin/tutorials", color: "indigoBg" },
  { icon: <FaVideo />, label: "Manage Live Classes", href: "/admin/classes", color: "yellowBg" },
  { icon: <FaUserTie />, label: "Manage Instructors", href: "/admin/instructors", color: "greenBg" },
  { icon: <FaUsers />, label: "Manage Users", href: "/admin/users", color: "blueBg" },
  { icon: <FaCreditCard />, label: "Payment Settings", href: "/admin/payments", color: "pinkBg" },
  { icon: <FaCog />, label: "System Config", href: "/admin/settings", color: "grayBg" },
];

export default function ManagementShortcuts() {
  return (
    <div className={`${styles.card} ${styles.spaced}`}>
      <h2 className={styles.title}>🧭 Quick Management Shortcuts</h2>
      <div className={styles.grid}>
        {shortcuts.map((item, idx) => (
          <Link href={item.href} key={idx}>
            <div className={styles.item}>
              <div className={`${styles.icon} ${styles[item.color] || ""}`}>
                {item.icon}
              </div>
              <span className={styles.label}>{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
