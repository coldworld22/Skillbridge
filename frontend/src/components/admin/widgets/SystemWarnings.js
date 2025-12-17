import styles from "./WidgetCards.module.scss";

export default function SystemWarnings() {
  return (
    <div className={styles.warning}>
      <p className={styles.warningTitle}>⚠️ System Warning</p>
      <p>Stripe webhook failed twice in the last 24 hours.</p>
    </div>
  );
}
