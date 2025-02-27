import Navbar from "@/components/website/sections/Navbar";
import { useState } from "react";
import { motion } from "framer-motion";
import { FaUsers, FaPlus, FaComments, FaPaperPlane } from "react-icons/fa";

const GroupChat = () => {
  const [groupMessages, setGroupMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Handle sending message
  const handleSendMessage = () => {
    if (newMessage.trim() === "") return;

    const newMsg = {
      id: groupMessages.length + 1,
      sender: "You",
      text: newMessage,
      timestamp: new Date().toISOString()
    };

    setGroupMessages([...groupMessages, newMsg]);
    setNewMessage("");
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <main className="container mx-auto p-6 pt-24">
        <h1 className="text-3xl font-bold text-yellow-500 flex items-center gap-2">
          <FaUsers /> Group Chat
        </h1>

        {/* Chat Box */}
        <div className="mt-6 bg-gray-800 p-4 rounded-lg min-h-[300px] flex flex-col">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex-1 overflow-y-auto space-y-4"
          >
            {groupMessages.length === 0 ? (
              <p className="text-center text-gray-400">No messages yet.</p>
            ) : (
              groupMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-gray-700 p-3 rounded-lg"
                >
                  <p className="text-yellow-400 font-semibold">{msg.sender}</p>
                  <p>{msg.text}</p>
                  <p className="text-sm text-gray-400">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                </motion.div>
              ))
            )}
          </motion.div>

          {/* Message Input */}
          <div className="flex items-center mt-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full p-2 bg-gray-700 text-white rounded-l-lg focus:outline-none"
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSendMessage}
              className="px-4 py-2 bg-green-500 text-white font-bold rounded-r-lg flex items-center gap-2"
            >
              <FaPaperPlane />
            </motion.button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GroupChat;
