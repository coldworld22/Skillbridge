import { useState, useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { FaCheckDouble, FaThumbtack, FaReply, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";

const ChatWindow = ({ selectedChat, onStartVideoCall }) => {
  const [messages, setMessages] = useState(selectedChat?.messages || []);
  const [typing, setTyping] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const chatRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // ✅ Function to send messages
  const sendMessage = (newMessage) => {
    if (replyingTo) {
      newMessage.replyTo = replyingTo;
      setReplyingTo(null);
    }
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setTyping(false);

    toast.success("New message sent!");
  };

  // ✅ Auto-scroll to latest message
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // ✅ Fix Typing Indicator - Reset after inactivity
  useEffect(() => {
    if (typing) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTyping(false), 2000);
    }
  }, [typing]);

  // ✅ Toggle Pin Message
  const togglePinMessage = (msg) => {
    setPinnedMessages((prev) =>
      prev.includes(msg) ? prev.filter((m) => m !== msg) : [...prev, msg]
    );
  };

  // ✅ Delete Message
  const deleteMessage = (index) => {
    setMessages((prevMessages) => prevMessages.filter((_, i) => i !== index));
    toast.info("Message deleted.");
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg col-span-3 flex flex-col">
      {/* ✅ Chat Header */}
      <ChatHeader selectedChat={selectedChat} onStartVideoCall={onStartVideoCall} />

      {/* ✅ Pinned Messages Section */}
      {pinnedMessages.length > 0 && (
        <div className="mb-2 p-2 rounded-lg bg-gray-900">
          <h3 className="text-sm text-yellow-500 font-semibold">📌 Pinned Messages</h3>
          {pinnedMessages.map((msg, index) => (
            <div key={index} className="text-gray-300 text-xs p-2 border-b border-gray-700">
              {msg.text}
            </div>
          ))}
        </div>
      )}

      {/* ✅ Message Display Area */}
      <div ref={chatRef} className="mt-4 space-y-4 max-h-80 overflow-y-auto p-4 border border-gray-700 rounded-lg">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-3 ${msg.sender === "You" ? "justify-end" : "justify-start"}`}>
            
            {/* ✅ Profile Icon */}
            {msg.sender !== "You" && (
              <img
                src={msg.profileImage || "/default-avatar.png"}
                alt="User"
                className="w-10 h-10 rounded-full border-2 border-yellow-500"
              />
            )}

            {/* ✅ Message Bubble */}
            <div className={`p-3 rounded-lg flex flex-col shadow-md max-w-xs ${msg.sender === "You" ? "bg-blue-500 text-white" : "bg-gray-700 text-white"}`}>
              
              {/* ✅ Reply-to Feature */}
              {msg.replyTo && (
                <div className="text-xs bg-gray-600 p-1 rounded mb-1">
                  <span className="text-yellow-400">Replying to:</span> {msg.replyTo.text}
                </div>
              )}

              {/* ✅ Sender Name */}
              {msg.sender !== "You" && <span className="text-xs text-gray-300 mb-1">{msg.sender}</span>}

              {/* ✅ Message Content */}
              {msg.image && <img src={msg.image} alt="Sent" className="w-24 h-24 rounded-lg" />}
              {msg.audio && <audio controls src={msg.audio} className="w-32 mt-1" />}
              <p className="text-sm">{msg.text}</p>

              {/* ✅ Timestamp, Read Status, Actions */}
              <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
                <span>{msg.timestamp}</span>
                <div className="flex items-center gap-2">
                  <FaCheckDouble className={`text-sm ${msg.status === "read" ? "text-blue-400" : "text-gray-400"}`} />
                  <button className="text-yellow-500 hover:text-yellow-600" onClick={() => togglePinMessage(msg)}>
                    <FaThumbtack />
                  </button>
                  <button className="text-gray-400 hover:text-gray-500" onClick={() => setReplyingTo(msg)}>
                    <FaReply />
                  </button>
                  <button className="text-red-500 hover:text-red-600" onClick={() => deleteMessage(index)}>
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* ✅ Typing Indicator */}
        {typing && <div className="text-gray-400 text-xs italic text-center">User is typing...</div>}
      </div>

      {/* ✅ Replying to Message Notification */}
      {replyingTo && (
        <div className="text-sm text-yellow-500 bg-gray-700 p-2 rounded-lg mt-2">
          Replying to: {replyingTo.text}
          <button className="ml-2 text-red-400 hover:text-red-500" onClick={() => setReplyingTo(null)}>
            ✖
          </button>
        </div>
      )}

      {/* ✅ Message Input Field */}
      <MessageInput sendMessage={sendMessage} setTyping={setTyping} />
    </div>
  );
};

export default ChatWindow;
