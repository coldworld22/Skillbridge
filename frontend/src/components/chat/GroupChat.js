import { useState, useEffect } from 'react';
import MessageInput from './MessageInput';
import MessageList from './MessageList';
import TypingIndicator from './TypingIndicator';
import ChatGroupHeader from './ChatGroupHeader';
import groupService from '@/services/groupService';


export default function GroupChat({ groupId }) {
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  useEffect(() => {
    if (!groupId) return;
    groupService.getGroupMessages(groupId).then(setMessages).catch(() => {});
  }, [groupId]);

  const sendMessage = async (newMessage) => {

    if (!newMessage.text && !newMessage.file && !newMessage.audio) return;
    try {
      const created = await groupService.sendGroupMessage(groupId, {
        text: newMessage.text,
        file: newMessage.file,
        audio: newMessage.audio,
      });

      if (created) {
        setMessages((prev) => [...prev, {
          id: created.id,
          sender: created.sender_name,
          senderId: created.sender_id,
          avatar: created.sender_avatar,
          text: created.content,

          file: created.file_url ? created.file_url : null,
          audio: created.audio_url ? created.audio_url : null,

          timestamp: created.sent_at,
        }]);
      }
    } catch (_) {}
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

