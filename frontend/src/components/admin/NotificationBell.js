import { useState } from "react";
import { FaBell } from "react-icons/fa";
import Link from "next/link";
import styles from "./NotificationBell.module.scss";

const notifications = [
  { id: 1, message: "3 tutorials awaiting approval", link: "/admin/tutorials" },
  { id: 2, message: "New instructor request from Ayman", link: "/admin/instructors" },
  { id: 3, message: "Live class 'Java Basics' scheduled", link: "/admin/classes" },
];

export default function NotificationBell() {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.wrapper}>
      {/* Bell Icon */}
      <button
        onClick={() => setOpen(!open)}
        className={styles.button}
      >
        <FaBell className={styles.icon} />
        {notifications.length > 0 && (
          <span className={styles.badge}>
            {notifications.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>Notifications</div>
          <ul className={styles.list}>
            {notifications.map((note) => (
              <li key={note.id}>
                <Link
                  href={note.link}
                  className={styles.item}
                >
                  {note.message}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
