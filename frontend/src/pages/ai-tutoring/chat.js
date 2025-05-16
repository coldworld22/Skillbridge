import { useState } from "react";

const models = [
  { key: "chatgpt", label: "ChatGPT 4" },
  { key: "deepseek", label: "DeepSeek AI" }
];

export default function AIChatTutorPage() {
  const [selectedModel, setSelectedModel] = useState("chatgpt");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const aiReply = {
        sender: "ai",
        text: `🤖 [${selectedModel.toUpperCase()}] Here’s a helpful explanation for: "${userMessage.text}"`
      };
      setMessages((prev) => [...prev, aiReply]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-10 px-4">
      <div className="max-w-3xl mx-auto flex flex-col h-[80vh] border border-gray-700 rounded-lg overflow-hidden">
        {/* Model Selector */}
        <div className="bg-gray-800 p-4 flex gap-6 justify-center border-b border-gray-700">
          {models.map((model) => (
            <label key={model.key} className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="radio"
                name="model"
                value={model.key}
                checked={selectedModel === model.key}
                onChange={() => setSelectedModel(model.key)}
                className="accent-yellow-500"
              />
              {model.label}
            </label>
          ))}
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`max-w-[80%] px-4 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                msg.sender === "user"
                  ? "bg-yellow-500 text-gray-900 self-end"
                  : "bg-gray-700 text-gray-200 self-start"
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div className="bg-gray-800 p-4 flex gap-2 border-t border-gray-700">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask your AI tutor..."
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none"
          />
          <button
            onClick={sendMessage}
            className="bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded-lg hover:bg-yellow-600"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}