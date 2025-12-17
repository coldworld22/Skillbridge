import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchClassReviews, submitClassReview } from '@/services/classService';
import styles from '../onlineClasses.module.scss';

const ClassReviews = ({ classId, canReview }) => {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ comment: '', rating: 0 });

  useEffect(() => {
    if (!classId) return;
    const load = async () => {
      try {
        const list = await fetchClassReviews(classId);
        setReviews(list);
      } catch (err) {
        console.error('Failed to load reviews', err);
      }
    };
    load();
  }, [classId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newReview.comment || newReview.rating === 0) return;

    try {
      await submitClassReview(classId, newReview);
      const list = await fetchClassReviews(classId);
      setReviews(list);
      setNewReview({ comment: '', rating: 0 });
    } catch (err) {
      console.error('Failed to submit review', err);
    }
  };

  return (
    <div className={styles.reviewCard}>
      <h3 className={styles.cardTitle}>Student Reviews</h3>

      {reviews.map((r) => (
        <div key={r.id} className={styles.section}>
          <div className={styles.cardHeader}>

            <span className={styles.instructorName}>{r.full_name}</span>
            <span className={styles.muted}>{new Date(r.created_at).toLocaleDateString()}</span>

          </div>
          <div className={styles.ratingRow}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={16} className={i < r.rating ? styles.pillSuccess : styles.muted} />
            ))}
          </div>
          <p className={styles.sectionBody}>{r.comment}</p>
        </div>
      ))}

      {canReview && (
        <form onSubmit={handleSubmit} className={styles.section}>
          <h4 className={styles.cardTitle}>Leave a Review</h4>

          <textarea
            rows="3"
            placeholder="Your Review"
            value={newReview.comment}
            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
            className={styles.textarea}
          />
          <div className={styles.meta}>
            <span>Rating:</span>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={18}
                className={`${i < newReview.rating ? styles.pillSuccess : styles.muted}`}
                onClick={() => setNewReview({ ...newReview, rating: i + 1 })}
              />
            ))}
          </div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.03 }}
            className={styles.primaryButton}
          >
            Submit Review
          </motion.button>
        </form>
      )}

      {!canReview && (
        <p className={`${styles.muted} ${styles.sectionBody}`}>Only enrolled students can leave a review.</p>
      )}
    </div>
  );
};

export default ClassReviews;
