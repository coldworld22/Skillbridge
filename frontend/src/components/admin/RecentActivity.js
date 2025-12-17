// components/admin/RecentActivity.js
import { FaBookOpen, FaUserPlus, FaVideo, FaCheckCircle } from "react-icons/fa";
import styles from "./AdminCards.module.scss";

const activities = [
  {
    icon: <FaBookOpen />,
    message: "New tutorial submitted: React Mastery",
    timestamp: "2 hours ago",
    color: "indigoText",
  },
  {
    icon: <FaVideo />,
    message: "Live class scheduled: JavaScript Bootcamp",
    timestamp: "3 hours ago",
    color: "yellowText",
  },
  {
    icon: <FaUserPlus />,
    message: "New user registered: sarah.dev@example.com",
    timestamp: "4 hours ago",
    color: "greenText",
  },
  {
    icon: <FaCheckCircle />,
    message: "Instructor approved: Mohammed Saeed",
    timestamp: "Yesterday",
    color: "blueText",
  },
];

export default function RecentActivity() {
  return (
    <div className={`${styles.card} ${styles.spaced}`}>
      <h2 className={styles.title}>📰 Recent Activity</h2>
      <ul className={styles.list}>
        {activities.map((activity, idx) => (
          <li key={idx} className={styles.row}>
            <span className={styles[activity.color] || ""}>{activity.icon}</span>
            <div>
              <p className={styles.label}>{activity.message}</p>
              <p className={styles.timestamp}>{activity.timestamp}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
