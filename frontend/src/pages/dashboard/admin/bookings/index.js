import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import BookingRow from '@/components/admin/bookings/BookingRow';
import BookingFilters from '@/components/admin/bookings/BookingFilters';
import BookingStats from '@/components/admin/bookings/BookingStats';
import BookingModal from '@/components/admin/bookings/BookingModal';
import {
  fetchAllBookings,
  updateBooking,
} from '@/services/admin/bookingService';
import { toast } from 'react-toastify';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const handleCancel = async (id, reason) => {
    try {
      await updateBooking(id, { status: 'cancelled', notes: reason });
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b))
      );
      toast.success('Booking cancelled');
    } catch (err) {
      console.error('Cancel booking failed', err);
      toast.error('Failed to cancel booking');
    }
  };

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const data = await fetchAllBookings();
        const formatted = (data || []).map((b) => ({
          id: b.id,
          student: {
            name: b.student_name || b.student_id,
            avatar:
              b.student_avatar_url ||
              "https://via.placeholder.com/40x40?text=S",
          },
          instructor: {
            name: b.instructor_name || b.instructor_id,
            avatar:
              b.instructor_avatar_url ||
              "https://via.placeholder.com/40x40?text=I",
          },
          classTitle: b.class_title || "—",
          date: b.start_time
            ? new Date(b.start_time).toISOString().split("T")[0]
            : "",
          time: b.start_time
            ? new Date(b.start_time).toISOString().split("T")[1].slice(0, 5)
            : "",
          duration:
            b.start_time && b.end_time
              ? `${Math.round(
                  (new Date(b.end_time) - new Date(b.start_time)) / 60000
                )} mins`
              : "",
          status: b.status,
          notes: b.notes,
        }));
        setBookings(formatted);
      } catch (err) {
        console.error("Failed to load bookings", err);
        toast.error("Failed to load bookings");
      }
    };
    loadBookings();
  }, []);

  const filtered = bookings.filter((b) => {
    const keyword = search.toLowerCase();
    const match =
      b.student.name.toLowerCase().includes(keyword) ||
      b.instructor.name.toLowerCase().includes(keyword) ||
      b.classTitle.toLowerCase().includes(keyword);
    return statusFilter === 'all' ? match : match && b.status === statusFilter;
  });

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

        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="w-full table-auto text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-2">Student</th>
                <th className="px-4 py-2">Instructor</th>
                <th className="px-4 py-2">Class</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Duration</th>
                <th className="px-4 py-2">Status</th>
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
                  <td colSpan={7} className="text-center text-gray-400 py-8">
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedBooking && (
          <BookingModal
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onCancel={handleCancel}
          />
        )}
      </div>
    </AdminLayout>
  );
}