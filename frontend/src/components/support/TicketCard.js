import StatusBadge from './StatusBadge';

export default function TicketCard({ ticket, onClick }) {
  return (
    <div
      onClick={onClick}
      className="border p-4 rounded-lg bg-white shadow transition hover:shadow-lg hover:border-yellow-400 cursor-pointer"
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">{ticket.subject}</h3>
        <StatusBadge status={ticket.status} />
      </div>
      <p className="text-sm text-gray-500">Priority: {ticket.priority}</p>
    </div>
  );
}
