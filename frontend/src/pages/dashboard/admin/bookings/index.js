import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import BookingRow from '@/components/admin/bookings/BookingRow';
import BookingFilters from '@/components/admin/bookings/BookingFilters';
import BookingStats from '@/components/admin/bookings/BookingStats';
import BookingModal from '@/components/admin/bookings/BookingModal';

const mockBookings = [
  {
    id: 1,
    student: { name: 'Ali Hassan', avatar: 'https://randomuser.me/api/portraits/men/11.jpg' },
    instructor: { name: 'Sarah Johnson', avatar: 'https://randomuser.me/api/portraits/women/1.jpg' },
    classTitle: 'Python Basics',
    date: '2025-05-10',
    time: '10:00 AM',
    duration: '1 hour',
    status: 'Scheduled'
  },
  {
    id: 2,
    student: { name: 'Lina Ahmed', avatar: 'https://randomuser.me/api/portraits/women/12.jpg' },
    instructor: { name: 'Mark Lee', avatar: 'https://randomuser.me/api/portraits/men/2.jpg' },
    classTitle: 'React Deep Dive',
    date: '2025-05-09',
    time: '3:00 PM',
    duration: '90 mins',
    status: 'Completed'
  },
];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    setBookings(mockBookings);
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
          />
        )}
      </div>
    </AdminLayout>
  );
}