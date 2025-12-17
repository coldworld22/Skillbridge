// 📁 pages/403.js
import Link from "next/link";
import styles from "./error.module.scss";

export default function AccessDenied() {
  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.code}>403</h1>
        <p className={styles.message}>Access Denied — You are not authorized to view this page.</p>
      </div>
      <Link href="/" passHref>
        <button className={styles.button}>
          Go Home
        </button>
      </Link>
    </div>
  );
}
