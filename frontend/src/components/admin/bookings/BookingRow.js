export default function BookingRow({ booking, onView }) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-700',
    declined: 'bg-red-100 text-red-600',
    cancelled: 'bg-red-100 text-red-600',
    completed: 'bg-green-100 text-green-700',
  };

  return (
    <tr
      className="border-t hover:bg-gray-50 cursor-pointer"
      onClick={onView}
    >
      <td className="px-4 py-2 flex items-center gap-2">
        <img src={booking.student.avatar} className="w-8 h-8 rounded-full" alt="student" />
        {booking.student.name}
      </td>
      <td className="px-4 py-2 flex items-center gap-2">
        <img src={booking.instructor.avatar} className="w-8 h-8 rounded-full" alt="instructor" />
        {booking.instructor.name}
      </td>
      <td className="px-4 py-2">{booking.type}</td>
      <td className="px-4 py-2 whitespace-nowrap">{booking.date}</td>
      <td className="px-4 py-2 whitespace-nowrap">{booking.time}</td>
      <td className="px-4 py-2 whitespace-nowrap">{booking.duration}</td>
      <td className="px-4 py-2">
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            statusColors[booking.status?.toLowerCase()] || 'bg-gray-100 text-gray-600'
          }`}
        >
          {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
        </span>
      </td>
      <td className="px-4 py-2 max-w-xs truncate">{booking.notes || '—'}</td>
    </tr>
  );
}