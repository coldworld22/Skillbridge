import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { askAI } from "@/services/aiService";

const Chatbot = ({ isOpen, onToggle }) => {
  const [messages, setMessages] = useState([
    { sender: "ai", text: "👋 Hi! How can I assist you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question) return;

    const userMsg = { sender: "user", text: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const { answer } = await askAI("chatgpt", question);
      const aiMsg = { sender: "ai", text: answer };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError("Failed to fetch response");
    } finally {
      setLoading(false);
    }
  };

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
            onClick={() => onToggle(false)}
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
                onClick={() => onToggle(false)}
                className="text-gray-900 hover:text-gray-700 transition"
              >
                <FaTimes className="text-2xl" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 mt-4 overflow-auto p-2 bg-gray-100 rounded-lg space-y-2">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`max-w-[80%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                    msg.sender === "user"
                      ? "bg-blue-500 text-white ml-auto"
                      : "bg-gray-300 text-gray-900"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {loading && (
                <div className="text-gray-500 text-sm">Thinking...</div>
              )}
              {error && <div className="text-red-500 text-sm">{error}</div>}
            </div>

            {/* Input Field */}
            <form onSubmit={handleSubmit} className="mt-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Chatbot;
