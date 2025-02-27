import { useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { FaSmile, FaPaperPlane } from "react-icons/fa";

const MessageInput = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  // Function to add selected emoji to input field
  const addEmoji = (emojiObject) => {
    setMessage((prev) => prev + emojiObject.emoji);
    setShowPicker(false); // Close picker after selecting emoji
  };

  return (
    <div className="relative flex items-center p-4 bg-gray-800 rounded-lg">
      {/* Emoji Picker Toggle Button */}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="mr-2 text-yellow-500 hover:text-yellow-400"
      >
        <FaSmile size={24} />
      </button>

      {/* Emoji Picker */}
      {showPicker && (
        <div className="absolute bottom-12 left-0 z-50">
          <EmojiPicker onEmojiClick={addEmoji} />
        </div>
      )}

      {/* Message Input */}
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="w-full p-2 bg-gray-700 text-white rounded-l-lg focus:outline-none"
      />

      {/* Send Button */}
      <button
        onClick={() => {
          if (message.trim()) {
            onSendMessage(message);
            setMessage(""); // Clear input after sending
          }
        }}
        className="px-4 py-2 bg-green-500 text-white font-bold rounded-r-lg hover:bg-green-600 transition"
      >
        <FaPaperPlane />
      </button>
    </div>
  );
};

export default MessageInput;
