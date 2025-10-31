import {
  FaCalendarCheck,
  FaCheckCircle,
  FaClipboardList,
  FaClock,
  FaTimesCircle,
} from 'react-icons/fa';

export default function BookingStats({ bookings }) {
  const total = bookings.length;
  const pending = bookings.filter((b) => b.status === 'pending').length;
  const scheduled = bookings.filter((b) => b.status === 'approved').length;
  const completed = bookings.filter((b) => b.status === 'completed').length;
  const cancelled = bookings.filter((b) => b.status === 'cancelled').length;

  const stats = [
    {
      label: 'Total',
      value: total,
      icon: FaClipboardList,
      accent: 'from-blue-500 to-blue-600',
      description: 'Across all statuses',
    },
    {
      label: 'Pending',
      value: pending,
      icon: FaClock,
      accent: 'from-amber-400 to-amber-500',
      description: 'Awaiting approval',
    },
    {
      label: 'Approved',
      value: scheduled,
      icon: FaCalendarCheck,
      accent: 'from-indigo-500 to-indigo-600',
      description: 'Scheduled sessions',
    },
    {
      label: 'Completed',
      value: completed,
      icon: FaCheckCircle,
      accent: 'from-emerald-500 to-emerald-600',
      description: 'Successfully finished',
    },
    {
      label: 'Cancelled',
      value: cancelled,
      icon: FaTimesCircle,
      accent: 'from-rose-500 to-rose-600',
      description: 'Cancelled bookings',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {stats.map(({ label, value, icon: Icon, accent, description }) => (
        <div
          key={label}
          className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <span
            className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${accent} text-white`}
          >
            <Icon size={16} />
          </span>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
      ))}
    </div>
  );
}
