import StatusBadge from './StatusBadge';

export default function TicketDetailPanel({ ticket }) {
  if (!ticket) return <div className="p-4">Select a ticket</div>;
  return (
    <div className="p-4 bg-white rounded-lg shadow space-y-4">
      <div className="flex items-center gap-3">
        <img
          src={ticket.user_avatar || '/images/default-avatar.png'}
          alt="avatar"
          className="w-8 h-8 rounded-full object-cover"
        />
        <div>
          <h2 className="text-xl font-semibold mb-1">{ticket.subject}</h2>
          <p className="text-sm text-gray-500">{ticket.user_name || ticket.user}</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={ticket.status} />
        </div>
      </div>
      <p className="whitespace-pre-line">{ticket.description}</p>
      <div className="space-y-3">
        {ticket.messages?.map((m) => (
          <div key={m.id} className="flex gap-3 items-start border p-2 rounded bg-gray-50">
            <img
              src={m.sender_avatar || '/images/default-avatar.png'}
              alt="avatar"
              className="w-6 h-6 rounded-full object-cover mt-1"
            />
            <div>
              <div className="text-xs font-semibold text-gray-700">
                {m.sender_name || 'User'}
                {m.createdAt && (
                  <span className="ml-2 text-gray-400">
                    {new Date(m.createdAt).toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{m.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
