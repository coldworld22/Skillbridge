import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { API_BASE_URL } from '@/config/config';
import { fetchClassComments, postClassComment } from '@/services/classService';
import styles from '../onlineClasses.module.scss';

const DEFAULT_AVATAR = '/images/default-avatar.png';
const API_BASE = (API_BASE_URL || '').replace(/\/$/, '');
const resolveAvatarUrl = (value) => {
  if (!value || value === 'null' || typeof value !== 'string') {
    return DEFAULT_AVATAR;
  }
  if (/^(?:https?:)?\/\//i.test(value) || value.startsWith('data:')) {
    return value;
  }
  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  return API_BASE ? `${API_BASE}${normalizedPath}` : normalizedPath;
};

const ClassComments = ({ classId, canComment }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    if (!classId) return;
    const load = async () => {
      try {
        const list = await fetchClassComments(classId);
        setComments(list);
      } catch (err) {
        console.error('Failed to load comments', err);
      }
    };
    load();
  }, [classId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    try {
      await postClassComment(classId, { message: newComment });
      const list = await fetchClassComments(classId);
      setComments(list);
      setNewComment('');
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Failed to post comment', err);
    }
  };



  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className={styles.reviewCard}>
      <h3 className={styles.cardTitle}>💬 Comments</h3>

      {canComment && (
        <div className={styles.section}>
          <input
            type="text"
            placeholder="Write a comment and press Enter..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={240}
            className={styles.input}
          />
          <button
            onClick={handleSubmit}
            className={styles.primaryButton}
          >
            <Send size={16} aria-hidden />
            Send
          </button>
        </div>
      )}

      {!canComment && (
        <p className={`${styles.muted} ${styles.sectionBody}`}>Only enrolled students can comment.</p>
      )}

      {comments.length === 0 ? (
        <p className={`${styles.muted} ${styles.sectionBody}`}>No comments yet. Be the first to share your thoughts!</p>
      ) : (
        <div className={styles.section} ref={containerRef}>
          {comments.map((comment) => {
            const avatarSrc = resolveAvatarUrl(comment.avatar_url);
            return (
              <motion.div
                key={comment.id}
                className={styles.commentCard}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className={styles.commentHeader}>
                  <img
                    src={avatarSrc}
                    alt={comment.full_name ? `${comment.full_name}'s avatar` : 'Student avatar'}
                    className={styles.commentAvatar}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = DEFAULT_AVATAR;
                    }}
                  />
                  <p className={styles.instructorName}>{comment.full_name}</p>
                </div>
                <p className={styles.commentBody}>{comment.message}</p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClassComments;
