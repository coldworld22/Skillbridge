import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { io } from "socket.io-client";
import { FaPaperPlane, FaSmile, FaUserCircle } from "react-icons/fa";

const socket = io("http://localhost:4000"); // WebSocket Server

const ChatBox = ({ courseName }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    // Listen for incoming messages
    socket.on("chatMessage", (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    // Listen for active users
    socket.on("activeUsers", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("chatMessage");
      socket.off("activeUsers");
    };
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = { user: "You", text: message, timestamp: new Date().toLocaleTimeString() };
      socket.emit("chatMessage", newMessage);
      setMessages([...messages, newMessage]);
      setMessage("");
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-yellow-400 mb-4">Course Discussion: {courseName}</h2>

      {/* Online Users */}
      <div className="mb-4">
        <p className="text-gray-400">Active Users ({onlineUsers.length} online)</p>
        <div className="flex space-x-2">
          {onlineUsers.map((user, index) => (
            <motion.div
              key={index}
              className="bg-green-500 text-white px-3 py-1 rounded-full text-sm"
              whileHover={{ scale: 1.1 }}
            >
              {user}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="h-64 overflow-y-auto bg-gray-700 p-4 rounded-lg mb-4">
        {messages.length > 0 ? (
          messages.map((msg, index) => (
            <motion.div
              key={index}
              className="mb-3 p-3 bg-gray-600 rounded-lg shadow"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <p className="text-yellow-300 font-semibold">{msg.user}</p>
              <p className="text-gray-200">{msg.text}</p>
              <span className="text-gray-400 text-xs">{msg.timestamp}</span>
            </motion.div>
          ))
        ) : (
          <p className="text-gray-400">No messages yet. Start the conversation!</p>
        )}
      </div>

      {/* Input Field */}
      <div className="flex">
        <input
          type="text"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none"
        />
        <button
          onClick={sendMessage}
          className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
        >
          <FaPaperPlane className="mr-2" /> Send
        </button>
      </div>
    </div>
  );
};

// Example Usage
const CourseChatPage = () => (
  <div className="container mx-auto p-6">
    <ChatBox courseName="Mastering React.js" />
  </div>
);

export default CourseChatPage;
