import { useEffect, useState } from 'react';
import groupService from '@/services/groupService';
import toast from 'react-hot-toast';
import { useTranslation } from 'next-i18next';
import styles from "./JoinRequestCard.module.scss";

export default function JoinRequestCard({
  groupId,
  onCountChange,
  onActionComplete,
}) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const { t } = useTranslation('dashboard', { keyPrefix: 'groupRequests' });

  useEffect(() => {
    let active = true;
    const fetchRequests = async () => {
      try {
        const data = await groupService.getJoinRequestsForGroup(groupId);
        if (!active) return;
        setRequests(data);
        if (onCountChange) onCountChange(data.length);
      } catch (error) {
        if (!active) return;
        toast.error(t('loadFailed'));
        setRequests([]);
        if (onCountChange) onCountChange(0);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchRequests();
    return () => {
      active = false;
    };
  }, [groupId, onCountChange]);

  const formatRequestedAt = (value) => {
    if (!value) return '';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return value;
    return dt.toLocaleString();
  };

  const handleAction = async (id, action) => {
    try {
      setProcessingId(id);
      const payload =
        action === 'approve'
          ? await groupService.approveRequest(id)
          : await groupService.rejectRequest(id);

      if (action === 'approve') {
        toast.success(t('approved'));
      } else {
        toast.success(t('rejected'));
      }

      setRequests((prev) => {
        const next = prev.filter((r) => r.id !== id);
        if (onCountChange) onCountChange(next.length);
        return next;
      });

      onActionComplete?.({ id, action, payload });
    } catch (error) {
      toast.error(t('actionFailed'));
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <p className={styles.muted}>{t('loading')}</p>;
  if (requests.length === 0) return <p className={styles.muted}>{t('empty')}</p>;

  return (
    <div className={styles.card}>
      {requests.map((req) => (
        <div
          key={req.id}
          className={styles.row}
        >
          <div className={styles.user}>
            <img
              src={req.avatar || '/images/default-avatar.png'}
              alt={req.name}
              className={styles.avatar}
            />
            <div>
              <p className={styles.name}>{req.name}</p>
              {req.role && (
                <p className={styles.meta}>
                  {req.role}
                </p>
              )}
              {req.email && (
                <p className={styles.email}>{req.email}</p>
              )}
              <p className={styles.time}>
                {formatRequestedAt(req.requestedAt)}
              </p>
            </div>
          </div>
          <div className={styles.actions}>
            <button
              onClick={() => handleAction(req.id, 'approve')}
              disabled={processingId === req.id}
              className={`${styles.action} ${styles.approve} ${
                processingId === req.id ? styles.disabled : ""
              }`}
            >
              {t('approve')}
            </button>
            <button
              onClick={() => handleAction(req.id, 'reject')}
              disabled={processingId === req.id}
              className={`${styles.action} ${styles.reject} ${
                processingId === req.id ? styles.disabled : ""
              }`}
            >
              {t('reject')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
