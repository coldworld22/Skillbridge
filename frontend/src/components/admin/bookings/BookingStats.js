export default function BookingStats({ bookings }) {
  const total = bookings.length;
  const scheduled = bookings.filter((b) => b.status === 'Scheduled').length;
  const completed = bookings.filter((b) => b.status === 'Completed').length;
  const cancelled = bookings.filter((b) => b.status === 'Cancelled').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded shadow text-center">
        <h4 className="text-lg font-semibold">Total</h4>
        <p className="text-2xl text-blue-600 font-bold">{total}</p>
      </div>
      <div className="bg-yellow-50 p-4 rounded shadow text-center">
        <h4 className="text-lg font-semibold">Scheduled</h4>
        <p className="text-2xl text-yellow-600 font-bold">{scheduled}</p>
      </div>
      <div className="bg-green-50 p-4 rounded shadow text-center">
        <h4 className="text-lg font-semibold">Completed</h4>
        <p className="text-2xl text-green-600 font-bold">{completed}</p>
      </div>
      <div className="bg-red-50 p-4 rounded shadow text-center">
        <h4 className="text-lg font-semibold">Cancelled</h4>
        <p className="text-2xl text-red-600 font-bold">{cancelled}</p>
      </div>
    </div>
  );
}
