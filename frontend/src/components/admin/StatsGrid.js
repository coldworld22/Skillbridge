// components/admin/StatsGrid.js
import styles from "./AdminCards.module.scss";

export default function StatsGrid({ stats = [] }) {
  const colorMap = {
    indigoText: styles.indigoText,
    yellowText: styles.yellowText,
    greenText: styles.greenText,
    blueText: styles.blueText,
    pinkText: styles.pinkText,
    grayText: styles.grayText,
    indigoBg: styles.indigoBg,
    yellowBg: styles.yellowBg,
    greenBg: styles.greenBg,
    blueBg: styles.blueBg,
    pinkBg: styles.pinkBg,
    grayBg: styles.grayBg,
  };

  const resolveColor = (key) => colorMap[key] || "";

  return (
    <div className={`${styles.grid} ${styles.spacedSm}`}>
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className={`${styles.card} ${stat.extraClass || ""}`}
          style={{ display: "flex", alignItems: "center", gap: "1rem" }}
        >
          <div className={resolveColor(stat.color)} style={{ fontSize: "1.75rem" }}>
            {stat.icon}
          </div>
          <div>
            <p className={styles.timestamp}>{stat.label}</p>
            <h3 className={styles.count} style={{ fontSize: "1.25rem" }}>{stat.value}</h3>
          </div>
        </div>
      ))}
    </div>
  );
}
