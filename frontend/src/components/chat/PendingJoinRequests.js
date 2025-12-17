import { useState, useEffect } from 'react';
import ChatImage from '../shared/ChatImage';
import groupService from '@/services/groupService';
import styles from './PendingJoinRequests.module.scss';

export default function PendingJoinRequests({ groupId, onApprove, onReject }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!groupId) return;
    let isMounted = true;
    groupService
      .getJoinRequestsForGroup(groupId)
      .then((data) => {
        if (isMounted) setRequests(data);
      })
      .catch(() => isMounted && setError('Failed to load requests'))
      .finally(() => isMounted && setLoading(false));
    return () => {
      isMounted = false;
    };
  }, [groupId]);

  const handleApprove = (id) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    onApprove?.(id);
  };

  const handleReject = (id) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    onReject?.(id);
  };

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>🕓 Pending Join Requests</h3>
      {loading ? (
        <p className={styles.muted}>Loading...</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : requests.length === 0 ? (
        <p className={styles.muted}>No pending requests.</p>
      ) : (
        requests.map((user) => (
          <div
            key={user.id}
            className={styles.card}
          >
            <div className={styles.row}>
              <ChatImage
                src={user.avatar}
                alt={user.name}
                className={styles.avatar}
                width={40}
                height={40}
              />
              <div>
                <p className={styles.name}>{user.name}</p>
                <span className={styles.timestamp}>{user.requestedAt}</span>
              </div>
            </div>
            <div className={styles.actions}>
              <button
                onClick={() => handleApprove(user.id)}
                className={`${styles.link} ${styles.approve}`}
              >
                Approve
              </button>
              <button
                onClick={() => handleReject(user.id)}
                className={`${styles.link} ${styles.reject}`}
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
