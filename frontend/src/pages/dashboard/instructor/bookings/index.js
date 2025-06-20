import { useEffect, useState } from 'react';
import InstructorLayout from '@/components/layouts/InstructorLayout';
import BookingModal from '@/components/admin/bookings/BookingModal';
import {
  fetchInstructorBookings,
  updateInstructorBooking,
} from '@/services/instructor/bookingService';

export default function InstructorBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const data = await fetchInstructorBookings();
        const formatted = (data || []).map((b) => ({
          id: b.id,
          student: {
            name: b.student_name || b.student_id,
            avatar:
              b.student_avatar_url ||
              'https://via.placeholder.com/40x40?text=S',
          },
          instructor: {
            name: 'You',
            avatar:
              b.instructor_avatar_url ||
              'https://via.placeholder.com/40x40?text=I',
          },
          classTitle: b.class_title || '—',
          date: b.start_time
            ? new Date(b.start_time).toISOString().split('T')[0]
            : '',
          time:
            b.start_time && b.end_time
              ? `${new Date(b.start_time)
                  .toISOString()
                  .split('T')[1]
                  .slice(0, 5)} - ${new Date(b.end_time)
                  .toISOString()
                  .split('T')[1]
                  .slice(0, 5)}`
              : b.start_time
              ? new Date(b.start_time).toISOString().split('T')[1].slice(0, 5)
              : '',
          duration:
            b.start_time && b.end_time
              ? `${Math.round(
                  (new Date(b.end_time) - new Date(b.start_time)) / 60000
                )} mins`
              : '',
          status: b.status,
          notes: b.notes,
        }));
        setBookings(formatted);
      } catch (err) {
        console.error('Failed to load bookings', err);
      }
    };
    loadBookings();
  }, []);

  const handleCancel = async (id, reason) => {
    try {
      await updateInstructorBooking(id, { status: 'cancelled', notes: reason });
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b))
      );
    } catch (err) {
      console.error('Cancel booking failed', err);
    }
  };

  return (
    <InstructorLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">My Bookings</h1>

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
                    <img src={b.student.avatar} className="w-8 h-8 rounded-full" />
                    {b.student.name}
                  </td>
                  <td className="px-4 py-2">{b.classTitle}</td>
                  <td className="px-4 py-2">{b.date}</td>
                  <td className="px-4 py-2">{b.time}</td>
                  <td className="px-4 py-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
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
    </InstructorLayout>
  );
}
