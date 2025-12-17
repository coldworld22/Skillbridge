import { FaExclamationCircle, FaTrash } from "react-icons/fa";
import styles from "./AdminCommunity.module.scss";

export default function ReportedPostCard({ report, onReview, onDelete }) {
  return (
    <div className={styles.card} style={{ borderLeft: "4px solid #ef4444" }}>
      <h4 className={styles.title}>{report.reason}</h4>
      <p className={styles.muted}>{report.content}</p>
      <div className={styles.actions}>
        <button onClick={() => onReview(report)} className={styles.button}>Review</button>
        <button onClick={() => onDelete(report)} className={`${styles.button} ${styles.danger}`}><FaTrash className="inline" /> Delete</button>
      </div>
    </div>
  );
}
