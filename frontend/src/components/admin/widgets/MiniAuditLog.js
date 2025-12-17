const logs = [
  "🧑‍🏫 Instructor Ayman approved",
  "📚 Tutorial 'Node Mastery' deleted",
  "👥 New user registered: mariam.dev",
];
import styles from "./WidgetCards.module.scss";

export default function MiniAuditLog() {
  return (
    <div className={styles.card}>
      <p className={styles.title}>🧾 Recent Actions</p>
      <ul className={styles.list}>
        {logs.map((log, i) => (
          <li key={i}>{log}</li>
        ))}
      </ul>
    </div>
  );
}
