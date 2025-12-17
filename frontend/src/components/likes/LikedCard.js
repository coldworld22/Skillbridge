import React from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import styles from './LikedCard.module.scss';

export default function LikedCard({ course, onRemove }) {
  const router = useRouter();

  const removeFromLikes = () => {
    let likes = JSON.parse(localStorage.getItem('likedClasses')) || [];
    likes = likes.filter((c) => c.id !== course.id);
    localStorage.setItem('likedClasses', JSON.stringify(likes));
    if (onRemove) onRemove(likes);
  };

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <img src={course.image} alt={course.title} className={styles.image} />
      <h2 className={styles.title}>{course.title}</h2>
      <p className={styles.muted}>{course.instructor}</p>
      <p className={styles.price}>{course.price === 0 ? 'Free' : course.price}</p>

      <div className={styles.actions}>
        <button
          className={`${styles.button} ${styles.primary}`}
          onClick={() => router.push(`/online-classes/${course.id}`)}
        >
          View Class
        </button>
        <button
          className={`${styles.button} ${styles.danger}`}
          onClick={removeFromLikes}
        >
          Remove
        </button>
      </div>
    </motion.div>
  );
}
