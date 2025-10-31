import { FaTimes } from 'react-icons/fa';
import { useState } from 'react';
import StatusBadge from '@/components/shared/ui/StatusBadge';

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close booking details"
        >
          <FaTimes size={18} />
        </button>

        <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Booking Details</h2>
            <p className="text-sm text-gray-500">
              Review student and instructor information, timing, and notes for this booking.
            </p>
          </div>
          <StatusBadge status={booking.status} size="md" />
        </header>

        <div className="space-y-6 text-sm text-gray-700">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Student
              </p>
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={booking.student.avatar}
                  className="h-10 w-10 rounded-full object-cover"
                  alt={`${booking.student.name} avatar`}
                />
                <span className="font-medium text-gray-900">{booking.student.name}</span>
              </div>
            </div>
            <div className="rounded-lg border border-gray-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Instructor
              </p>
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={booking.instructor.avatar}
                  className="h-10 w-10 rounded-full object-cover"
                  alt={`${booking.instructor.name} avatar`}
                />
                <span className="font-medium text-gray-900">{booking.instructor.name}</span>
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div className="rounded-lg border border-gray-100 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Booking Type
              </dt>
              <dd className="mt-1 font-medium text-gray-900">{booking.type}</dd>
            </div>
            <div className="rounded-lg border border-gray-100 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Date
              </dt>
              <dd className="mt-1 font-medium text-gray-900">{booking.date || '—'}</dd>
            </div>
            <div className="rounded-lg border border-gray-100 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Time
              </dt>
              <dd className="mt-1 font-medium text-gray-900">{booking.time || '—'}</dd>
            </div>
            <div className="rounded-lg border border-gray-100 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Duration
              </dt>
              <dd className="mt-1 font-medium text-gray-900">{booking.duration || '—'}</dd>
            </div>
          </dl>

            {booking.notes && (
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Notes
            </p>
            <p className="mt-2 whitespace-pre-wrap text-gray-700">{booking.notes}</p>
          </div>
        )}
        </div>

        {booking.status?.toLowerCase() === 'pending' && onApprove && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
            >
              Approve Booking
            </button>
            <button
              onClick={() => setShowDeclineConfirm(true)}
              disabled={isProcessing}
              className="w-full rounded-lg border border-rose-500 px-4 py-2 font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-rose-300 disabled:text-rose-300"
            >
              Decline Request
            </button>
          </div>
        )}

        {booking.status?.toLowerCase() === 'approved' && onComplete && (
          <div className="mt-6">
            <button
              onClick={handleComplete}
              disabled={isProcessing}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
            >
              Mark as Completed
            </button>
          </div>
        )}

        {(booking.status?.toLowerCase() === 'pending' ||
          booking.status?.toLowerCase() === 'approved') && (
          <div className="mt-6">
            <button
              onClick={() => setShowCancelConfirm(true)}
              disabled={isProcessing}
              className="w-full rounded-lg bg-rose-600 px-4 py-2 font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-400"
            >
              Cancel Booking
            </button>
          </div>
        )}

        {booking.status === 'cancelled' && onDelete && (
          <div className="mt-6">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isProcessing}
              className="w-full rounded-lg bg-rose-600 px-4 py-2 font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-400"
            >
              Delete Booking
            </button>
          </div>
        )}

        {showCancelConfirm && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-gray-800">Cancel Reason (optional)</h4>
            <textarea
              rows={3}
              className="mb-3 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              disabled={isProcessing}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={isProcessing}
                className="rounded-lg border border-gray-300 px-4 py-1 text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-400 disabled:border-gray-200"
              >
                Back
              </button>
              <button
                onClick={handleCancel}
                disabled={isProcessing}
                className="rounded-lg bg-rose-600 px-4 py-1 text-sm font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-400"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        )}

        {showDeclineConfirm && (
          <div className="mt-6 rounded-lg border border-rose-100 bg-rose-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-rose-700">
              Decline Reason (optional)
            </h4>
            <textarea
              rows={3}
              className="mb-3 w-full rounded-lg border border-rose-200 p-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              disabled={isProcessing}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeclineConfirm(false)}
                disabled={isProcessing}
                className="rounded-lg border border-rose-200 px-4 py-1 text-sm font-medium text-rose-600 hover:bg-rose-100 disabled:cursor-not-allowed disabled:text-rose-300 disabled:border-rose-100"
              >
                Back
              </button>
              <button
                onClick={handleDecline}
                disabled={isProcessing}
                className="rounded-lg bg-rose-600 px-4 py-1 text-sm font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-400"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        )}

        {showDeleteConfirm && onDelete && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="mb-3 text-sm text-gray-700">
              Are you sure you want to permanently delete this booking? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isProcessing}
                className="rounded-lg border border-gray-300 px-4 py-1 text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-400 disabled:border-gray-200"
              >
                Back
              </button>
              <button
                onClick={handleDelete}
                disabled={isProcessing}
                className="rounded-lg bg-rose-600 px-4 py-1 text-sm font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-400"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
