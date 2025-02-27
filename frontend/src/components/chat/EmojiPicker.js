import { useState } from "react";
import Picker from "emoji-picker-react";
import { FaSmile } from "react-icons/fa";

const EmojiPicker = ({ onSelectEmoji }) => {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setShowPicker(!showPicker)} className="text-yellow-500 hover:text-yellow-600 transition">
        <FaSmile size={24} />
      </button>
      {showPicker && (
        <div className="absolute bottom-10 left-0 z-10">
          <Picker onEmojiClick={(event, emoji) => onSelectEmoji(emoji.emoji)} />
        </div>
      )}
    </div>
  );
};

export default EmojiPicker;
