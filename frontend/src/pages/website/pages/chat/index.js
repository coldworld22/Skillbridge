import { useState, useEffect } from "react";
import Navbar from "@/components/website/sections/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { FaPaperPlane, FaUserCircle, FaEllipsisH } from "react-icons/fa";
import mockUsers from "@/mocks/sampleUsers.json"; // ✅ Mock users for now

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeUsers, setActiveUsers] = useState(mockUsers); // ✅ Mock users for now
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Simulated existing messages (Replace with API call later)
    setMessages([
      { id: 1, sender: "John", text: "Hello, how are you?", time: "10:30 AM" },
      { id: 2, sender: "Jane", text: "I'm good! What about you?", time: "10:31 AM" }
    ]);
  }, []);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 2000);
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const newMsg = {
      id: messages.length + 1,
      sender: "You",
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([...messages, newMsg]);
    setNewMessage("");
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <main className="container mx-auto p-6 pt-24 flex">
        {/* Active Users Sidebar */}
        <aside className="w-1/4 p-4 bg-gray-800 rounded-lg shadow-lg">
          <h3 className="text-lg font-bold text-yellow-500">🔵 Active Users</h3>
          <ul className="mt-4 space-y-3">
            {activeUsers.map((user) => (
              <li key={user.id} className="flex items-center gap-2 p-2 bg-gray-700 rounded">
                <FaUserCircle className={`text-xl ${user.online ? "text-green-400" : "text-gray-400"}`} />
                <div>
                  <span className="text-white">{user.name}</span>
                  <p className={`text-sm ${user.online ? "text-green-400" : "text-gray-400"}`}>
                    {user.online ? "Online" : "Offline"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        {/* Chat Box */}
        <section className="w-3/4 p-4 bg-gray-800 rounded-lg shadow-lg ml-4">
          <h3 className="text-lg font-bold text-yellow-500 flex items-center justify-between">
            💬 Chat Room
            <FaEllipsisH className="text-xl cursor-pointer" />
          </h3>
          <div className="mt-4 p-4 h-80 overflow-y-auto bg-gray-700 rounded-lg">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`mb-2 p-2 rounded-lg ${msg.sender === "You" ? "bg-yellow-500 text-gray-900 self-end" : "bg-gray-600 text-white"}`}
              >
                <strong>{msg.sender}</strong>: {msg.text} <span className="text-sm opacity-75">{msg.time}</span>
              </motion.div>
            ))}
          </div>

          {/* Typing Indicator */}
          {isTyping && <p className="text-sm text-gray-400 mt-2">Someone is typing...</p>}

          {/* Message Input */}
          <div className="mt-4 flex">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={handleTyping}
              className="w-full p-2 rounded-l-lg bg-gray-700 focus:outline-none"
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={sendMessage}
              className="p-2 bg-yellow-500 text-gray-900 rounded-r-lg hover:bg-yellow-600 transition"
            >
              <FaPaperPlane />
            </motion.button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ChatPage;
