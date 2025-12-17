import React from 'react';
import styles from './onlineClasses.module.scss';

function OnlineClassesHero() {
  return (
    <section className={styles.hero}>
      <h2 className={styles.heroTitle}>
        Find Your Next Live Class
      </h2>
      <p className={styles.heroText}>
        Learn with experts in real-time. Reserve your spot before seats run out.
      </p>
    </section>
  );
}

export default OnlineClassesHero;
