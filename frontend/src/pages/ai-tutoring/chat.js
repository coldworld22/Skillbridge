import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaRobot, FaPaperPlane } from 'react-icons/fa';

/**
 * AI Chat Tutor component
 */
export default function AIChatTutor() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  /**
   * Handles sending a message
   */
  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = { sender: 'user', text: message };
    setChatHistory((prev) => [...prev, userMessage]);
    setMessage('');

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();

      setChatHistory((prev) => [
        ...prev,
        { sender: 'ai', text: data.response },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="p-10 bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">
        <FaRobot className="inline-block mr-2" />
        AI Chat Tutor
      </h1>
      <p className="mt-4 text-lg text-gray-300">
        Chat with an AI tutor for real-time answers and explanations.
      </p>

      <div className="mt-6 w-full max-w-2xl bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col">
        <div className="h-80 overflow-y-auto p-4 border border-gray-700 rounded-lg bg-gray-900">
          {chatHistory.length === 0 ? (
            <p className="text-gray-500 text-center">
              Start a conversation by asking a question...
            </p>
          ) : (
            chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`p-3 my-2 rounded-lg w-fit ${
                  msg.sender === 'user'
                    ? 'bg-blue-500 self-end'
                    : 'bg-gray-700 self-start'
                }`}
              >
                {msg.text}
              </div>
            ))
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600"
            placeholder="Ask the AI tutor..."
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={handleSendMessage}
            className="p-3 bg-yellow-500 text-gray-900 font-semibold rounded-lg shadow-lg hover:bg-yellow-600 transition"
          >
            <FaPaperPlane />
          </motion.button>
        </div>
      </div>
    </div>
  );
}