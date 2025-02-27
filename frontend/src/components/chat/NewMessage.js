import { useState } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { motion } from "framer-motion";

const NewMessage = ({ onSendMessage }) => {
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (newMessage.trim() === "") return;
    onSendMessage(newMessage);
    setNewMessage("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gray-800 p-4 rounded-lg flex items-center"
    >
      <input
        type="text"
        placeholder="Type a message..."
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
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
    </motion.div>
  );
};

export default NewMessage;
