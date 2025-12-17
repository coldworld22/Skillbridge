import { useEffect, useState } from 'react';
import StudentLayout from '@/components/layouts/StudentLayout';
import BookingCard from '@/components/student/instructors/BookingCard';
import {
  fetchStudentBookings,
  deleteStudentBooking,
} from '@/services/student/bookingService';
import { API_BASE_URL } from '@/config/config';
import { toast } from 'react-toastify';
import { FaSpinner } from 'react-icons/fa';

export default function StudentBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const normalizeBooking = (booking) => {
    if (!booking) return null;

    const instructor = booking.instructor || {};
    const avatarSource =
      instructor.avatar ||
      booking.instructor_avatar ||
      booking.instructor_avatar_url;
    const avatar = avatarSource
      ? avatarSource.startsWith('http')
        ? avatarSource
        : `${API_BASE_URL}${avatarSource}`
      : 'https://via.placeholder.com/56x56?text=I';

    return {
      ...booking,
      instructor: {
        ...instructor,
        name: instructor.name || booking.instructor_name || 'Instructor',
        avatar,
        id: instructor.id || booking.instructor_id,
      },
      subject: booking.subject || booking.class_title || 'Session',
      date:
        booking.date ||
        (booking.start_time
          ? new Date(booking.start_time).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })
          : ''),
      status: (booking.status || '').toLowerCase(),
    };
  };

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setError('');
        const data = await fetchStudentBookings();
        setBookings((data || []).map(normalizeBooking).filter(Boolean));
      } catch (err) {
        console.error('Failed to load bookings', err);
        setError('Failed to load bookings. Please refresh to try again.');
        toast.error('Failed to load bookings. Please refresh to try again.');
      } finally {
        setLoading(false);
      }
    };
    loadBookings();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;

    try {
      await deleteStudentBooking(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
      toast.success('Booking cancelled');
    } catch (err) {
      console.error('Failed to cancel booking', err);
      toast.error('Unable to cancel booking. Please try again.');
    }
  };

  const handleChat = (instructorId) => {
    window.location.href = `/messages?userId=${instructorId}`;
  };

  return (
    <StudentLayout>
      <section className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">My Bookings</h1>
        <p className="mb-6 text-sm text-gray-500">
          Review upcoming sessions and reach out to instructors directly from here.
        </p>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <FaSpinner className="animate-spin text-3xl text-blue-600" />
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
                {error}
              </div>
            )}
            {bookings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
                No bookings yet.
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onCancel={() => handleCancel(booking.id)}
                    onChat={() => handleChat(booking.instructor.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </StudentLayout>
  );
}
