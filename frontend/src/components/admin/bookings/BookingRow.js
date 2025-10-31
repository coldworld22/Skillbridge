import StatusBadge from '@/components/shared/ui/StatusBadge';

export default function BookingRow({ booking, onView }) {
  return (
    <tr
      className="border-t hover:bg-gray-50 cursor-pointer"
      onClick={onView}
    >
      <td className="px-4 py-2 flex items-center gap-2">
        <img
          src={booking.student.avatar}
          className="h-8 w-8 rounded-full object-cover"
          alt={`${booking.student.name} avatar`}
        />
        {booking.student.name}
      </td>
      <td className="px-4 py-2 flex items-center gap-2">
        <img
          src={booking.instructor.avatar}
          className="h-8 w-8 rounded-full object-cover"
          alt={`${booking.instructor.name} avatar`}
        />
        {booking.instructor.name}
      </td>
      <td className="px-4 py-2">{booking.type}</td>
      <td className="px-4 py-2 whitespace-nowrap">{booking.date}</td>
      <td className="px-4 py-2 whitespace-nowrap">{booking.time}</td>
      <td className="px-4 py-2 whitespace-nowrap">{booking.duration}</td>
      <td className="px-4 py-2">
        <StatusBadge status={booking.status} />
      </td>
      <td className="px-4 py-2 max-w-xs truncate">{booking.notes || '—'}</td>
    </tr>
  );
}
