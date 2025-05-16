import { useState } from 'react';

export default function InviteUserModal({ groupId, onClose }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    // Mock invite send (replace with real logic later)
    console.log(`📨 Invite sent to ${email} for group ${groupId}`);
    setSent(true);
    setTimeout(onClose, 1000); // auto close after 1s
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Invite User</h2>
        <input
          type="email"
          placeholder="User email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-gray-500">Cancel</button>
          <button onClick={handleSend} className="bg-blue-600 text-white px-4 py-2 rounded">
            {sent ? 'Sent!' : 'Send Invite'}
          </button>
        </div>
      </div>
    </div>
  );
}
