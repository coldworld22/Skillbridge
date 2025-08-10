import React, { useState } from 'react';
import { filterMessage } from './MessageFilter';
import { toast } from 'react-toastify';
import { logModerationEvent } from '@/services/chatService';

function ChatInput() {
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    const { isClean, matchedWords } = filterMessage(message);

    if (!isClean) {
      alert(`⚠️ Inappropriate language detected: ${matchedWords.join(', ')}`);
      try {
        await logModerationEvent({ message, matchedWords });
      } catch (err) {
        console.error('Failed to log moderation event', err);
      }
      return;
    }

    // send message
    toast.success('Message sent');
    setMessage('');
  };

  return (
    <div className="flex items-center w-full">
      <input
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="flex-1 px-4 py-2 rounded-md bg-gray-800 text-white focus:outline-none"
      />
      <button
        onClick={handleSend}
        className="ml-2 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-md"
      >
        Send
      </button>
    </div>
  );
}

export default ChatInput;
