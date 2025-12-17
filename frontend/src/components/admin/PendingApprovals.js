// components/admin/PendingApprovals.js
import Link from "next/link";
import { FaBookOpen, FaVideo, FaUserCheck } from "react-icons/fa";
import styles from "./AdminCards.module.scss";

const items = [
  {
    label: "Tutorials Awaiting Review",
    count: 12,
    icon: <FaBookOpen />,
    href: "/admin/tutorials",
    color: "indigoText",
  },
  {
    label: "Live Classes to Approve",
    count: 4,
    icon: <FaVideo />,
    href: "/admin/classes",
    color: "yellowText",
  },
  {
    label: "Instructor Requests",
    count: 3,
    icon: <FaUserCheck />,
    href: "/admin/instructors",
    color: "greenText",
  },
];

export default function PendingApprovals() {
  return (
    <div className={`${styles.card} ${styles.spaced}`}>
      <h2 className={styles.title}>🚦 Pending Admin Actions</h2>
      <ul className={styles.list}>
        {items.map((item, idx) => (
          <li key={idx}>
            <Link href={item.href}>
              <div className={styles.row}>
                <div className={styles.rowLabel}>
                  <span className={styles[item.color] || ""}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                <span className={styles.count}>{item.count}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
