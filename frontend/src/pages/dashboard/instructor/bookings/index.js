import { useEffect, useState } from 'react';
import InstructorLayout from '@/components/layouts/InstructorLayout';
import BookingModal from '@/components/admin/bookings/BookingModal';

const mockBookings = [
  {
    id: 1,
    student: { name: 'Ali Hassan', avatar: 'https://randomuser.me/api/portraits/men/11.jpg' },
    instructor: { name: 'You', avatar: 'https://randomuser.me/api/portraits/women/1.jpg' },
    classTitle: 'Python Basics',
    date: '2025-05-10',
    time: '10:00 AM',
    duration: '1 hour',
    status: 'Scheduled'
  },
  {
    id: 2,
    student: { name: 'Sara Alami', avatar: 'https://randomuser.me/api/portraits/women/21.jpg' },
    instructor: { name: 'You', avatar: 'https://randomuser.me/api/portraits/women/1.jpg' },
    classTitle: 'Data Science 101',
    date: '2025-05-08',
    time: '2:00 PM',
    duration: '2 hours',
    status: 'Completed'
  }
];

export default function InstructorBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    setBookings(mockBookings);
  }, []);

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
          />
        )}
      </div>
    </InstructorLayout>
  );
}
