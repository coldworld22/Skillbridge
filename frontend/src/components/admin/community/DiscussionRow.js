import { FaTrash, FaLock, FaEye } from "react-icons/fa";
import styles from "./AdminCommunity.module.scss";

export default function DiscussionRow({ discussion, onView, onDelete, onLock }) {
  return (
    <div className={styles.card} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <h4 className={styles.title}>{discussion.title}</h4>
        <p className={styles.muted}>By {discussion.user}</p>
      </div>
      <div className={styles.actions}>
        <button className={styles.button} onClick={() => onView(discussion)} title="View"><FaEye /></button>
        <button className={styles.button} onClick={() => onLock(discussion)} title="Lock"><FaLock /></button>
        <button className={`${styles.button} ${styles.danger}`} onClick={() => onDelete(discussion)} title="Delete"><FaTrash /></button>
      </div>
    </div>
 );
}
