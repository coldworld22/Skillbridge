import { useState } from 'react';

export default function TicketReplyBox({ onSend, loading = false, disabled = false }) {
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    await onSend(message.trim());
    setMessage('');
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
      <label htmlFor="reply" className="block text-sm font-medium text-gray-700">
        Your Reply
      </label>
      <textarea
        id="reply"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your response here..."
        disabled={loading || disabled}
        className="w-full min-h-[120px] border border-gray-300 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 disabled:bg-gray-100"
      />

      <button
        type="submit"
        disabled={loading || disabled || !message.trim()}
        className="inline-flex items-center px-5 py-2 rounded-md text-sm font-semibold bg-yellow-500 hover:bg-yellow-600 text-black transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Sending..." : "Send Reply"}
      </button>
    </form>
  );
}
