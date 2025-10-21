import { useState, useEffect, useRef } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { fetchCallMessages, sendCallMessage } from "@/services/videoCallService";
import socket from "@/services/socketService";
import { toast } from "react-toastify";

const ChatDuringCall = ({ chatId, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!chatId) return;

    let active = true;

    fetchCallMessages(chatId)
      .then((data) => {
        if (active) setMessages(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setMessages([]);
      });

    if (!socket.connected) socket.connect();

    const handleMessage = (msg) => {
      if (msg?.room_id !== chatId) return;
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("call-message", handleMessage);

    return () => {
      active = false;
      socket.off("call-message", handleMessage);
    };
  }, [chatId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async () => {
    const text = newMessage.trim();
    if (!text) return;
    try {
      await sendCallMessage(chatId, { text });
    } catch (err) {
      toast.error("Failed to send message");
    }
    setNewMessage("");
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-lg font-bold text-yellow-500">💬 Chat</h3>
      <div className="max-h-48 overflow-y-auto space-y-2 my-3 pr-2">
        {messages.map((msg, index) => (
          <MessageBubble key={msg.id || index} msg={msg} currentUserId={currentUserId} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-2 bg-gray-700 text-white rounded-md"
        />
        <button className="p-2 bg-green-500 rounded text-white" onClick={sendMessage}>
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

/* 🛠️ Utility Component for Chat Bubbles */
const MessageBubble = ({ msg, currentUserId }) => {
  const isSelf =
    (msg.sender_id && msg.sender_id === currentUserId) ||
    (!msg.sender_id && msg.sender === "You");
  const senderLabel = isSelf ? "You" : msg.sender || "Participant";
  return (
    <div
      className={`p-2 rounded-lg max-w-xs ${
        isSelf ? "bg-yellow-500 text-gray-900 ml-auto" : "bg-gray-700"
      }`}
    >
      <strong>{senderLabel}</strong>
      <p>{msg.text}</p>
    </div>
  );
};

export default ChatDuringCall;
