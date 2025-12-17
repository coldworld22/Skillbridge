import React, { useState } from 'react';
import { filterMessage } from './MessageFilter';
import { toast } from 'react-toastify';
import { logModerationEvent } from '@/services/chatService';
import styles from "./ChatInputs.module.scss";

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
    <div className={styles.chatInput}>
      <input
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className={styles.text}
      />
      <button
        onClick={handleSend}
        className={styles.send}
      >
        Send
      </button>
    </div>
  );
}

export default ChatInput;
