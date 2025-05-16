export default function BookingRow({ booking, onView }) {
  const statusColors = {
    Scheduled: 'bg-yellow-100 text-yellow-800',
    Completed: 'bg-green-100 text-green-700',
    Cancelled: 'bg-red-100 text-red-600',
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
      <td className="px-4 py-2">{booking.classTitle}</td>
      <td className="px-4 py-2">{booking.date}</td>
      <td className="px-4 py-2">{booking.time}</td>
      <td className="px-4 py-2">{booking.duration}</td>
      <td className="px-4 py-2">
        <span
          className={`text-xs px-2 py-1 rounded-full ${statusColors[booking.status]}`}
        >
          {booking.status}
        </span>
      </td>
    </tr>
  );
}