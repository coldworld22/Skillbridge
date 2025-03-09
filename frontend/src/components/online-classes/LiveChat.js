import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FaPaperPlane } from "react-icons/fa";

const LiveChat = ({ liveClassId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatRef = useRef(null);

  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      setMessages([...messages, { user: "You", text: newMessage }]);
      setNewMessage("");
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg w-full mt-6">
      <h3 className="text-lg font-semibold text-yellow-400">💬 Live Chat</h3>
      <div className="h-64 overflow-y-auto bg-gray-700 p-2 rounded-lg mt-2">
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            className="p-2 bg-gray-600 text-white rounded-md mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <strong className="text-yellow-300">{msg.user}: </strong>
            {msg.text}
          </motion.div>
        ))}
        <div ref={chatRef}></div>
      </div>
      <div className="flex mt-3">
        <input
          type="text"
          placeholder="Type your message..."
          className="w-full p-2 bg-gray-700 text-white rounded-l-lg focus:outline-none"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} className="bg-yellow-500 p-3 rounded-r-lg hover:bg-yellow-600 transition">
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default LiveChat;
