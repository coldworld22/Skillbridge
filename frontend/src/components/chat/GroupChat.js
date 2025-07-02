import { useState, useEffect } from 'react';
import MessageInput from './MessageInput';
import MessageList from './MessageList';
import TypingIndicator from './TypingIndicator';
import ChatGroupHeader from './ChatGroupHeader';
import groupService from '@/services/groupService';
import toast from 'react-hot-toast';


export default function GroupChat({ groupId, groupName }) {
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [replyTo, setReplyTo] = useState(null);

  useEffect(() => {
    if (!groupId) return;
    let isMounted = true;

    const fetchMessages = async () => {
      try {
        const msgs = await groupService.getGroupMessages(groupId);
        if (isMounted) setMessages(msgs);
      } catch (_) {}
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    const typingPoll = setInterval(async () => {
      try {
        const names = await groupService.getTypingStatus(groupId);
        setTypingUsers(names);
      } catch (_) {}
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      clearInterval(typingPoll);
    };
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
        groupService.setTypingStatus(groupId, false).catch(() => {});
      }
    } catch (_) {}
  };

  const handleDelete = async (id) => {
    try {
      await groupService.deleteGroupMessage(id);
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
      toast.success('Message deleted');
    } catch (_) {
      toast.error('Failed to delete message');
    }
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
      <ChatGroupHeader groupId={groupId} groupName={groupName} />

      <div className="h-64 overflow-y-auto bg-gray-100 dark:bg-gray-800 border rounded p-3">
        <MessageList
          messages={messages}
          onDelete={handleDelete}
          onPin={handlePin}
          onReply={handleReply}
        />
      </div>

      <TypingIndicator names={typingUsers} />

      <MessageInput
        sendMessage={sendMessage}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onTyping={(isTyping) => {
          setTyping(isTyping);
          groupService.setTypingStatus(groupId, isTyping).catch(() => {});
        }}
      />
    </div>
  );
}

