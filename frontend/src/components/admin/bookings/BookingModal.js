import { FaTimes } from 'react-icons/fa';
import { useState } from 'react';
import StatusBadge from '@/components/shared/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import styles from './BookingModal.module.scss';

export default function BookingModal({
  booking,
  onClose,
  onCancel,
  onDelete,
  onApprove,
  onDecline,
  onComplete,
}) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!booking) return null;

  const runAction = async (task) => {
    if (!task) return;
    setIsProcessing(true);
    try {
      await task();
      onClose();
    } finally {
      setIsProcessing(false);
      setShowCancelConfirm(false);
      setShowDeclineConfirm(false);
      setShowDeleteConfirm(false);
      setCancelReason('');
      setDeclineReason('');
    }
  };

  const handleApprove = () => runAction(() => onApprove?.(booking.id));
  const handleDecline = () =>
    runAction(() => onDecline?.(booking.id, declineReason));
  const handleCancel = () =>
    runAction(() => onCancel?.(booking.id, cancelReason));
  const handleDelete = () => runAction(() => onDelete?.(booking.id));
  const handleComplete = () => runAction(() => onComplete?.(booking.id));

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.card}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          className={styles.close}
          aria-label="Close booking details"
        >
          <FaTimes size={18} />
        </button>

        <header className={styles.header} style={{ marginBottom: '1rem' }}>
          <div>
            <h2 className={styles.title}>Booking Details</h2>
            <p className={styles.subtitle}>
              Review student and instructor information, timing, and notes for this booking.
            </p>
          </div>
          <StatusBadge status={booking.status} size="md" />
        </header>

        <div className={styles.content}>
          <div className={styles.gridTwo}>
            <div className={styles.infoCard}>
              <p className={styles.label}>
                Student
              </p>
              <div className={styles.row}>
                <img
                  src={booking.student.avatar}
                  className={styles.avatar}
                  alt={`${booking.student.name} avatar`}
                />
                <span className={styles.name}>{booking.student.name}</span>
              </div>
            </div>
            <div className={styles.infoCard}>
              <p className={styles.label}>
                Instructor
              </p>
              <div className={styles.row}>
                <img
                  src={booking.instructor.avatar}
                  className={styles.avatar}
                  alt={`${booking.instructor.name} avatar`}
                />
                <span className={styles.name}>{booking.instructor.name}</span>
              </div>
            </div>
          </div>

          <dl className={styles.gridTwo}>
            <div className={styles.infoCard}>
              <dt className={styles.label}>
                Booking Type
              </dt>
              <dd className={styles.name}>{booking.type}</dd>
            </div>
            <div className={styles.infoCard}>
              <dt className={styles.label}>
                Date
              </dt>
              <dd className={styles.name}>{booking.date || '—'}</dd>
            </div>
            <div className={styles.infoCard}>
              <dt className={styles.label}>
                Time
              </dt>
              <dd className={styles.name}>{booking.time || '—'}</dd>
            </div>
            <div className={styles.infoCard}>
              <dt className={styles.label}>
                Duration
              </dt>
              <dd className={styles.name}>{booking.duration || '—'}</dd>
            </div>
          </dl>

          {booking.notes && (
            <div className={styles.noteCard}>
              <p className={styles.label}>Notes</p>
              <p className={styles.noteText}>{booking.notes}</p>
            </div>
          )}
        </div>

        {booking.status?.toLowerCase() === 'pending' && onApprove && (
          <div className={styles.actions}>
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              variant="accent"
            >
              Approve Booking
            </Button>
            <Button
              onClick={() => setShowDeclineConfirm(true)}
              disabled={isProcessing}
              variant="outline"
            >
              Decline Request
            </Button>
          </div>
        )}

        {booking.status?.toLowerCase() === 'approved' && onComplete && (
          <div className={styles.actions}>
            <Button
              onClick={handleComplete}
              disabled={isProcessing}
              variant="accent"
            >
              Mark as Completed
            </Button>
          </div>
        )}

        {(booking.status?.toLowerCase() === 'pending' ||
          booking.status?.toLowerCase() === 'approved') && (
          <div className={styles.actions}>
            <Button
              onClick={() => setShowCancelConfirm(true)}
              disabled={isProcessing}
              variant="danger"
            >
              Cancel Booking
            </Button>
          </div>
        )}

        {booking.status === 'cancelled' && onDelete && (
          <div className={styles.actions}>
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isProcessing}
              variant="danger"
            >
              Delete Booking
            </Button>
          </div>
        )}

        {showCancelConfirm && (
          <div className={styles.confirmBox}>
            <h4 className={styles.confirmTitle}>Cancel Reason (optional)</h4>
            <textarea
              rows={3}
              className={styles.textarea}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              disabled={isProcessing}
            />
            <div className={styles.buttons}>
              <Button
                onClick={() => setShowCancelConfirm(false)}
                disabled={isProcessing}
                variant="neutral"
              >
                Back
              </Button>
              <Button
                onClick={handleCancel}
                disabled={isProcessing}
                variant="danger"
              >
                Confirm Cancel
              </Button>
            </div>
          </div>
        )}

        {showDeclineConfirm && (
          <div className={styles.confirmBox}>
            <h4 className={styles.confirmTitle}>
              Decline Reason (optional)
            </h4>
            <textarea
              rows={3}
              className={styles.textarea}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              disabled={isProcessing}
            />
            <div className={styles.buttons}>
              <Button
                onClick={() => setShowDeclineConfirm(false)}
                disabled={isProcessing}
                variant="neutral"
              >
                Back
              </Button>
              <Button
                onClick={handleDecline}
                disabled={isProcessing}
                variant="danger"
              >
                Confirm Decline
              </Button>
            </div>
          </div>
        )}

        {showDeleteConfirm && onDelete && (
          <div className={styles.confirmBox}>
            <p className={styles.subtitle}>
              Are you sure you want to permanently delete this booking? This action cannot be
              undone.
            </p>
            <div className={styles.buttons}>
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isProcessing}
                variant="neutral"
              >
                Back
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isProcessing}
                variant="danger"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
