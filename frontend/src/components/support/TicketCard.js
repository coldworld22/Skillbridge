import StatusBadge from './StatusBadge';
import { FiClock, FiTag } from 'react-icons/fi';
import Image from 'next/image';

export default function TicketCard({ ticket, onClick }) {
  const bgColors = {
    open: 'bg-blue-50',
    pending: 'bg-yellow-50',
    resolved: 'bg-green-50',
    closed: 'bg-gray-50',
  };

  return (
    <div
      onClick={onClick}
      className={`border p-4 rounded-xl shadow-sm transition hover:shadow-md hover:border-yellow-400 cursor-pointer ${bgColors[ticket.status] || 'bg-white'}`}
    >
      {/* Header: Subject & Status */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-lg text-gray-800 truncate">{ticket.subject}</h3>
        <StatusBadge status={ticket.status} />
      </div>

      <div className="text-xs text-gray-500 mb-2 font-mono">#{ticket.ticket_number}</div>

      {/* Metadata: Priority, User, Date */}
      <div className="flex items-center text-sm text-gray-500 gap-4 flex-wrap">
        <span className="flex items-center gap-1">
          <FiTag className="text-yellow-500" />
          {ticket.priority}
        </span>
        <span className="flex items-center gap-1">
          <Image
            src={ticket.user_avatar || '/images/default-avatar.png'}
            alt={
              ticket.customerName
                ? `${ticket.customerName}'s avatar`
                : ticket.user_name
                ? `${ticket.user_name}'s avatar`
                : ticket.user
                ? `${ticket.user}'s avatar`
                : 'User avatar'
            }
            width={16}
            height={16}
            className="w-4 h-4 rounded-full object-cover"
          />
          {ticket.customerName || ticket.user_name || ticket.user || 'Unknown'}
        </span>
        <span className="flex items-center gap-1">
          <FiClock className="text-gray-400" />
          {new Date(ticket.createdAt).toLocaleDateString()}
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
