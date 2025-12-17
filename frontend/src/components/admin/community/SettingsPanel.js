import styles from "./AdminCommunity.module.scss";

export default function SettingsPanel({ children, title }) {
  return (
    <div className={styles.card}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <div className={styles.muted}>{children}</div>
    </div>
  );
}
