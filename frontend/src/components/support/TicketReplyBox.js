import { useState } from 'react';

export default function TicketReplyBox({ onSend }) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSend(message);
    setMessage('');
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="flex-1 border rounded px-2 py-1"
        placeholder="Type a reply"
      />
      <button className="bg-yellow-500 text-black px-3 rounded" type="submit">
        Send
      </button>
    </form>
  );
}
