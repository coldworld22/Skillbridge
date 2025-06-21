import { FaTimes } from 'react-icons/fa';
import { useState } from 'react';

export default function BookingModal({ booking, onClose, onCancel }) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  if (!booking) return null;

  const handleCancel = () => {
    if (onCancel) {
      onCancel(booking.id, cancelReason);
    }
    setShowCancelConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-black"
        >
          <FaTimes size={18} />
        </button>

        <h2 className="text-xl font-bold mb-4">Booking Details</h2>

        <div className="space-y-3 text-sm">
          <div>
            <strong>Student:</strong>
            <div className="flex items-center gap-2 mt-1">
              <img src={booking.student.avatar} className="w-8 h-8 rounded-full" />
              {booking.student.name}
            </div>
          </div>

          <div>
            <strong>Instructor:</strong>
            <div className="flex items-center gap-2 mt-1">
              <img src={booking.instructor.avatar} className="w-8 h-8 rounded-full" />
              {booking.instructor.name}
            </div>
          </div>

          <div><strong>Booking Type:</strong> {booking.type}</div>
          <div><strong>Date:</strong> {booking.date}</div>
          <div><strong>Time:</strong> {booking.time}</div>
          <div><strong>Duration:</strong> {booking.duration}</div>
          <div><strong>Status:</strong> <span className="capitalize">{booking.status}</span></div>
          {booking.notes && (
            <div className="whitespace-pre-wrap">
              <strong>Notes:</strong> {booking.notes}
            </div>
          )}
        </div>

        {(booking.status?.toLowerCase() === 'pending' ||
          booking.status?.toLowerCase() === 'approved') && (
          <div className="mt-6">
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Cancel Booking
            </button>
          </div>
        )}

        {showCancelConfirm && (
          <div className="mt-4 border-t pt-4">
            <h4 className="font-semibold text-sm mb-2">Cancel Reason (optional)</h4>
            <textarea
              rows={3}
              className="w-full border p-2 rounded text-sm mb-2"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-1 text-sm border rounded"
              >
                Back
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-1 text-sm bg-red-600 text-white rounded"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
