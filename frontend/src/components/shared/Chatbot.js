import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaRobot } from "react-icons/fa";

const Chatbot = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay Background */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black backdrop-blur-md z-40"
            onClick={onClose}
          />

          {/* Chatbot Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed bottom-0 right-4 w-80 h-[450px] bg-white shadow-xl rounded-lg p-6 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">AI Assistant</h3>
              <button 
                onClick={onClose} 
                className="text-gray-900 hover:text-gray-700 transition"
              >
                <FaTimes className="text-2xl" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 mt-4 overflow-auto p-2 bg-gray-100 rounded-lg">
              <p className="text-gray-700">👋 Hi! How can I assist you today?</p>
            </div>

            {/* Input Field */}
            <input
              type="text"
              placeholder="Type a message..."
              className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Chatbot;
