import { useState } from 'react';
import MessageInput from './MessageInput';
import MessageList from './MessageList';
import TypingIndicator from './TypingIndicator';
import ChatGroupHeader from './ChatGroupHeader';

const mockMessages = [
  { id: 1, sender: 'Sarah', text: 'Welcome to the group!', timestamp: new Date().toISOString() },
  { id: 2, sender: 'Ali', text: 'Thanks! Happy to be here.', timestamp: new Date().toISOString() },
];

export default function GroupChat({ groupId }) {
  const [messages, setMessages] = useState(mockMessages);
  const [typing, setTyping] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  const sendMessage = (newMessage) => {
    setMessages((prev) => [...prev, { ...newMessage, id: Date.now(), timestamp: new Date().toISOString() }]);
  };

  const handleDelete = (id) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const handlePin = (id) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, pinned: !msg.pinned } : msg))
    );
  };

  const handleReply = (message) => {
    setReplyTo(message);
  };

  return (
    <div className="space-y-4">
      <ChatGroupHeader groupId={groupId} />

      <div className="h-64 overflow-y-auto bg-gray-100 dark:bg-gray-800 border rounded p-3">
        <MessageList
          messages={messages}
          onDelete={handleDelete}
          onPin={handlePin}
          onReply={handleReply}
        />
      </div>

      <TypingIndicator isTyping={typing} />

      <MessageInput
        sendMessage={sendMessage}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onTyping={(isTyping) => setTyping(isTyping)}
      />
    </div>
  );
}