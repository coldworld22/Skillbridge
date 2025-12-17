import { useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { FaSmile, FaPaperPlane } from "react-icons/fa";
import styles from "./messageInput.module.scss";

const MessageInput = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  // Function to add selected emoji to input field
  const addEmoji = (emojiObject) => {
    setMessage((prev) => prev + emojiObject.emoji);
    setShowPicker(false); // Close picker after selecting emoji
  };

  return (
    <div className={styles.wrapper}>
      <button
        onClick={() => setShowPicker(!showPicker)}
        className={styles.emojiButton}
        aria-label="Toggle emoji picker"
      >
        <FaSmile size={24} />
      </button>

      {showPicker && (
        <div className={styles.picker}>
          <EmojiPicker onEmojiClick={addEmoji} />
        </div>
      )}

      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className={styles.input}
      />

      <button
        onClick={() => {
          if (message.trim()) {
            onSendMessage(message);
            setMessage(""); // Clear input after sending
          }
        }}
        className={styles.send}
        aria-label="Send message"
      >
        <FaPaperPlane />
      </button>
    </div>
  );
};

export default MessageInput;
