import { useState, useEffect } from "react";
import socket from "@/services/socketService";
import { FaPaperPlane, FaSmile } from "react-icons/fa";

const ChatRoom = ({ username, room }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.emit("joinRoom", { username, room });

    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("message");
    };
  }, [room]);

  const sendMessage = () => {
    if (message.trim() !== "") {
      socket.emit("chatMessage", message);
      setMessage("");
    }
  };

  return (
    <div className="p-4 bg-gray-900 text-white rounded-lg shadow-md">
      <h3 className="text-lg font-bold">💬 Group Chat</h3>
      <div className="h-64 overflow-y-auto bg-gray-800 p-4 rounded-lg mt-2">
        {messages.map((msg, index) => (
          <p key={index} className="text-gray-300 p-2">{msg}</p>
        ))}
      </div>
      <div className="flex mt-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="w-full p-2 border rounded-l-lg focus:outline-none"
        />
        <button onClick={sendMessage} className="px-6 bg-yellow-500 text-black rounded-r-lg hover:bg-yellow-600 transition">
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;
