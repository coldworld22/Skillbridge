import StatusBadge from './StatusBadge';
import { FiClock, FiUser, FiTag } from 'react-icons/fi';

export default function TicketCard({ ticket, onClick }) {
  return (
    <div
      onClick={onClick}
      className="border p-4 rounded-xl bg-white shadow-sm transition hover:shadow-md hover:border-yellow-400 cursor-pointer"
    >
      {/* Header: Subject & Status */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-lg text-gray-800 truncate">{ticket.subject}</h3>
        <StatusBadge status={ticket.status} />
      </div>

      {/* Metadata: Priority, User, Date */}
      <div className="flex items-center text-sm text-gray-500 gap-4 flex-wrap">
        <span className="flex items-center gap-1">
          <FiTag className="text-yellow-500" />
          {ticket.priority}
        </span>
        <span className="flex items-center gap-1">
          <FiUser className="text-blue-500" />
          {ticket.user_name || 'Unknown'}
        </span>
        <span className="flex items-center gap-1">
          <FiClock className="text-gray-400" />
          {new Date(ticket.created_at).toLocaleDateString()}
        </span>
      </div>

      {/* Optional message preview */}
      {ticket.message && (
        <p className="text-gray-600 text-sm mt-3 line-clamp-2">
          {ticket.message}
        </p>
      )}
    </div>
  );
}
