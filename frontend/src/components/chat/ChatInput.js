import { useState } from "react";
import { FaPaperPlane } from "react-icons/fa";
import EmojiPicker from "./EmojiPicker";

const ChatInput = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");

  const sendMessage = () => {
    if (message.trim() !== "") {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <div className="flex mt-2">
      <EmojiPicker onSelectEmoji={(emoji) => setMessage((prev) => prev + emoji)} />
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
  );
};

export default ChatInput;
