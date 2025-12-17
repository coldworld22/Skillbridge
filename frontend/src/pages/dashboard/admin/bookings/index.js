import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import BookingRow from '@/components/admin/bookings/BookingRow';
import BookingFilters from '@/components/admin/bookings/BookingFilters';
import BookingStats from '@/components/admin/bookings/BookingStats';
import BookingModal from '@/components/admin/bookings/BookingModal';
import BookingSummaryCard from '@/components/dashboard/bookings/BookingSummaryCard';
import {
  fetchAllBookings,
  updateBooking,
  deleteBooking,
} from '@/services/admin/bookingService';
import { API_BASE_URL } from '@/config/config';
import { toast } from 'react-toastify';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        setError('');
        const data = await fetchAllBookings();
        if (!isMounted) return;
        setBookings((data || []).map(formatBooking).filter(Boolean));
      } catch (err) {
        console.error('Failed to load bookings', err);
        if (isMounted) {
          setError('Failed to load bookings. Please refresh to try again.');
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

  const statusCounts = useMemo(() => {
    const counts = { all: bookings.length };
    bookings.forEach((booking) => {
      const status = (booking.status || '').toLowerCase();
      counts[status] = (counts[status] ?? 0) + 1;
    });
    return counts;
  }, [bookings]);

  return (
    <AdminLayout>
      <section className="space-y-6 p-4 lg:p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Bookings</h1>
          <p className="text-sm text-gray-500">
            Monitor incoming requests, manage cancellations, and review booking details across the platform.
          </p>
        </div>

        <BookingStats bookings={bookings} />
        <BookingFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          statusCounts={statusCounts}
        />

        {loading && (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-32 animate-pulse rounded-xl border border-gray-200 bg-gray-100/60"
              />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Instructor</th>
                      <th className="px-4 py-3">Booking Type</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Notes</th>
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
                        <td colSpan={8} className="py-8 text-center text-gray-400">
                          No bookings match your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4 md:hidden">
              {filtered.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-500">
                  No bookings match your filters.
                </div>
              ) : (
                filtered.map((b) => (
                  <BookingSummaryCard
                    key={b.id}
                    avatar={b.student.avatar}
                    title={b.student.name}
                    subtitle={`Instructor: ${b.instructor.name} • ${b.type}`}
                    status={b.status}
                    meta={[
                      { label: 'Date', value: b.date },
                      { label: 'Time', value: b.time },
                      { label: 'Duration', value: b.duration },
                    ]}
                    note={b.notes}
                    onClick={() => setSelectedBooking(b)}
                  />
                ))
              )}
            </div>
          </>
        )}

        {selectedBooking && (
          <BookingModal
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onCancel={handleCancel}
            onDelete={handleDelete}
          />
        )}
      </section>
    </AdminLayout>
  );
}
