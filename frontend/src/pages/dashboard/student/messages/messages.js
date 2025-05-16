// pages/dashboard/instructor/messages.js
import { useState } from 'react';
import StudentLayout from "@/components/layouts/StudentLayout";
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';

const mockConversations = [
  {
    id: 101,
    name: 'Alice Johnson',
    avatar: 'https://i.pravatar.cc/150?img=1',
    unreadCount: 2,
    messages: [
      { sender: 'Alice', text: 'Hi, can we confirm the lesson time?', timestamp: '10:30 AM' },
      { sender: 'You', text: 'Sure, 2PM works!', timestamp: '10:32 AM' }
    ]
  },
  {
    id: 102,
    name: 'Mark Lee',
    avatar: 'https://i.pravatar.cc/150?img=2',
    unreadCount: 0,
    messages: [
      { sender: 'Mark', text: 'Thanks for the great session!', timestamp: 'Yesterday' }
    ]
  }
];

export default function InstructorMessagesPage() {
  const [selected, setSelected] = useState(mockConversations[0]);
  const [messages, setMessages] = useState(selected.messages);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (newMessage) => {
    const updated = [...messages, { sender: 'You', text: newMessage, timestamp: 'Now' }];
    setMessages(updated);
    // simulate student response typing
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1500);
  };

  return (
    <StudentLayout>
      <div className="flex h-[calc(100vh-80px)] bg-white border rounded shadow overflow-hidden">
        {/* Sidebar: conversation list */}
        <aside className="w-1/3 border-r p-4 space-y-4 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Messages</h2>
          {mockConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => {
                setSelected(conv);
                setMessages(conv.messages);
                conv.unreadCount = 0;
                setIsTyping(true);
                setTimeout(() => setIsTyping(false), 2000);
              }}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 ${
                selected.id === conv.id ? 'bg-gray-100' : ''
              }`}
            >
              <div className="relative">
                <img src={conv.avatar} alt={conv.name} className="w-10 h-10 rounded-full" />
                {conv.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              <span className="font-medium">{conv.name}</span>
            </div>
          ))}
        </aside>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b font-semibold">{selected.name}</div>
          <div className="flex-1 p-4 overflow-y-auto">
            <MessageList messages={messages} />
            {isTyping && (
              <div className="text-sm text-gray-500 mt-2 italic">
                {selected.name} is typing...
              </div>
            )}
          </div>
          <div className="p-4 border-t">
            <MessageInput onSend={handleSend} />

          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
