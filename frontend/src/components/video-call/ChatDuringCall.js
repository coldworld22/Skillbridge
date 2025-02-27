import { useState } from "react";
import { FaPaperPlane } from "react-icons/fa";

const ChatDuringCall = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages([...messages, { sender: "You", text: newMessage }]);
    setNewMessage("");
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-lg font-bold text-yellow-500">💬 Chat</h3>
      <div className="max-h-48 overflow-y-auto space-y-2 my-3">
        {messages.map((msg, index) => (
          <MessageBubble key={index} msg={msg} />
        ))}
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
const MessageBubble = ({ msg }) => (
  <div className={`p-2 rounded-lg max-w-xs ${msg.sender === "You" ? "bg-yellow-500 text-gray-900 ml-auto" : "bg-gray-700"}`}>
    <strong>{msg.sender}</strong>
    <p>{msg.text}</p>
  </div>
);

export default ChatDuringCall;
