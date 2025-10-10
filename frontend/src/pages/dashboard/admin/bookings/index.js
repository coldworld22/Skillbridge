import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import BookingRow from '@/components/admin/bookings/BookingRow';
import BookingFilters from '@/components/admin/bookings/BookingFilters';
import BookingStats from '@/components/admin/bookings/BookingStats';
import BookingModal from '@/components/admin/bookings/BookingModal';
import {
  fetchAllBookings,
  updateBooking,
  deleteBooking,
} from '@/services/admin/bookingService';
import { API_BASE_URL } from '@/config/config';
import { toast } from 'react-toastify';
import { FaSpinner } from 'react-icons/fa';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  const buildAvatar = useCallback((value, fallbackText) => {
    if (!value) return `https://via.placeholder.com/40x40?text=${fallbackText}`;
    return value.startsWith('http') ? value : `${API_BASE_URL}${value}`;
  }, [API_BASE_URL]);

  const formatBooking = useCallback((booking) => {
    if (!booking) return null;

    const start = booking.start_time ? new Date(booking.start_time) : null;
    const end = booking.end_time ? new Date(booking.end_time) : null;

    return {
      id: booking.id,
      student: {
        name: booking.student_name || booking.student_id,
        avatar: buildAvatar(booking.student_avatar_url, 'S'),
      },
      instructor: {
        name: booking.instructor_name || booking.instructor_id,
        avatar: buildAvatar(booking.instructor_avatar_url, 'I'),
      },
      type: booking.class_title ? 'Class' : 'Tutorial',
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
    };
  }, [buildAvatar]);

  const handleCancel = async (id, reason) => {
    try {
      await updateBooking(id, { status: 'cancelled', notes: reason });
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

  const handleDelete = async (id) => {
    try {
      await deleteBooking(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
      toast.success('Booking deleted');
    } catch (err) {
      console.error('Delete booking failed', err);
      toast.error('Failed to delete booking');
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadBookings = async () => {
      try {
        const data = await fetchAllBookings();
        if (!isMounted) return;
        setBookings((data || []).map(formatBooking).filter(Boolean));
      } catch (err) {
        console.error("Failed to load bookings", err);
        if (isMounted) {
          toast.error("Failed to load bookings");
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

  const filtered = useMemo(() => {
    const keyword = search.toLowerCase();

    return bookings.filter((b) => {
      const match =
        b.student.name.toLowerCase().includes(keyword) ||
        b.instructor.name.toLowerCase().includes(keyword) ||
        b.type.toLowerCase().includes(keyword);
      if (statusFilter === 'all') return match;
      return match && b.status === statusFilter;
    });
  }, [bookings, search, statusFilter]);

  return (
    <AdminLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">All Bookings</h1>

        <BookingStats bookings={bookings} />
        <BookingFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
        />

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <FaSpinner className="animate-spin text-3xl text-blue-500" />
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="min-w-full table-auto text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="px-4 py-2">Student</th>
                  <th className="px-4 py-2">Instructor</th>
                  <th className="px-4 py-2">Booking Type</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Time</th>
                  <th className="px-4 py-2">Duration</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <BookingRow
                    key={b.id}
                    booking={b}
                    onView={() => setSelectedBooking(b)}
                  />
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-gray-400 py-8">
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
            onDelete={handleDelete}
          />
        )}
      </div>
    </AdminLayout>
  );
}
