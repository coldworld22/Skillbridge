// components/admin/community/NavCard.js
import Link from "next/link";
import styles from "./AdminCommunity.module.scss";

export default function NavCard({ href, icon, label }) {
  return (
    <Link href={href}>
      <div className={`${styles.card} hover:bg-gray-50`} style={{ display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer" }}>
        <div className="text-3xl text-yellow-500">{icon}</div>
        <div className={styles.title}>{label}</div>
      </div>
    </Link>
  );
}
