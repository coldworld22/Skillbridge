import { useCallback, useEffect, useMemo, useState } from 'react';
import InstructorLayout from '@/components/layouts/InstructorLayout';
import BookingModal from '@/components/admin/bookings/BookingModal';
import {
  fetchInstructorBookings,
  updateInstructorBooking,
} from '@/services/instructor/bookingService';
import { API_BASE_URL } from '@/config/config';
import { toast } from 'react-toastify';
import { FaSpinner } from 'react-icons/fa';

export default function InstructorBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  const normalizeAvatar = useCallback((value, fallbackText) => {
    if (!value) {
      return `https://via.placeholder.com/40x40?text=${fallbackText}`;
    }

    return value.startsWith('http') ? value : `${API_BASE_URL}${value}`;
  }, [API_BASE_URL]);

  const formatBooking = useCallback(
    (booking) => {
      if (!booking) return null;

      const start = booking.start_time ? new Date(booking.start_time) : null;
      const end = booking.end_time ? new Date(booking.end_time) : null;

      return {
        id: booking.id,
        student: {
          name: booking.student_name || booking.student_id,
          avatar: normalizeAvatar(booking.student_avatar_url, 'S'),
        },
        instructor: {
          name: 'You',
          avatar: normalizeAvatar(booking.instructor_avatar_url, 'I'),
        },
        classTitle: booking.class_title || '—',
        date: start
          ? start.toLocaleDateString(undefined, { dateStyle: 'medium' })
          : '',
        time:
          start && end
            ? `${start.toLocaleTimeString(undefined, { timeStyle: 'short' })} - ${end.toLocaleTimeString(undefined, { timeStyle: 'short' })}`
            : start
            ? start.toLocaleTimeString(undefined, { timeStyle: 'short' })
            : '',
        duration:
          start && end
            ? `${Math.round((end.getTime() - start.getTime()) / 60000)} mins`
            : '',
        status: (booking.status || '').toLowerCase(),
        notes: booking.notes,
        type: booking.class_title ? 'Class' : 'Session',
      };
    },
    [normalizeAvatar]
  );

  useEffect(() => {
    let isMounted = true;

    const loadBookings = async () => {
      try {
        const data = await fetchInstructorBookings();
        if (!isMounted) return;
        setBookings((data || []).map(formatBooking).filter(Boolean));
      } catch (err) {
        console.error('Failed to load bookings', err);
        if (isMounted) {
          toast.error('Failed to load bookings');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadBookings();

    return () => {
      isMounted = false;
    };
  }, [formatBooking]);

  const handleCancel = async (id, reason) => {
    try {
      await updateInstructorBooking(id, { status: 'cancelled', notes: reason });
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                status: 'cancelled',
                notes: reason || b.notes,
              }
            : b
        )
      );
      toast.success('Booking cancelled');
    } catch (err) {
      console.error('Cancel booking failed', err);
      toast.error('Failed to cancel booking');
    }
  };

  const statusStyles = useMemo(
    () => ({
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-600',
      completed: 'bg-green-100 text-green-700',
    }),
    []
  );

  return (
    <InstructorLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">My Bookings</h1>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <FaSpinner className="animate-spin text-3xl text-blue-500" />
          </div>
        ) : (
          <div className="bg-white shadow rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="px-4 py-2">Student</th>
                  <th className="px-4 py-2">Class</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Time</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr
                    key={b.id}
                    className="border-t hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedBooking(b)}
                  >
                    <td className="px-4 py-2 flex items-center gap-2">
                      <img src={b.student.avatar} className="w-8 h-8 rounded-full" alt={b.student.name} />
                      {b.student.name}
                    </td>
                    <td className="px-4 py-2">{b.classTitle}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{b.date}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{b.time}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full capitalize ${
                          statusStyles[b.status] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {b.status || 'pending'}
                      </span>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-400 py-8">
                      No bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {selectedBooking && (
          <BookingModal
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onCancel={handleCancel}
          />
        )}
      </div>
    </InstructorLayout>
  );
}
