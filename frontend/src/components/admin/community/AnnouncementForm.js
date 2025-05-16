import { useState } from "react";

export default function AnnouncementForm({ onPost }) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    onPost(message.trim());
    setMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Post a new announcement..."
        rows={3}
        className="w-full border rounded px-3 py-2"
        required
      />
      <button type="submit" className="mt-2 bg-yellow-500 px-5 py-2 rounded text-white font-semibold">
        Post
      </button>
    </form>
  );
}
