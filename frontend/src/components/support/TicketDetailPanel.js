import StatusBadge from './StatusBadge';

export default function TicketDetailPanel({ ticket }) {
  if (!ticket) return <div className="p-4">Select a ticket</div>;
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-1">{ticket.subject}</h2>
      <StatusBadge status={ticket.status} />
      <p className="mt-2 whitespace-pre-line">{ticket.description}</p>
      <div className="mt-4 space-y-2">
        {ticket.messages?.map((m) => (
          <div key={m.id} className="border p-2 rounded">
            <p className="text-sm text-gray-600">{m.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
