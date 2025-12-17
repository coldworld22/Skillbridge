import React from "react";
import styles from "./BookCardSkeleton.module.scss";

export default function BookCardSkeleton() {
  return (
    <div className={styles.card}>
      <div className={styles.media} />
      <div className={styles.body}>
        <div className={styles.line} style={{ width: "75%" }} />
        <div className={`${styles.line} ${styles.lineShort}`} />
        <div className={styles.iconRow}>
          <div className={styles.circle} />
          <div className={styles.circle} />
          <div className={styles.circle} />
        </div>
      </div>
    </div>
  );
}
