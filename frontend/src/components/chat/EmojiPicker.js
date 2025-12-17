import { useState } from "react";
import Picker from "emoji-picker-react";
import { FaSmile } from "react-icons/fa";
import styles from "./EmojiPicker.module.scss";

const EmojiPicker = ({ onSelectEmoji }) => {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className={styles.wrapper}>
      <button onClick={() => setShowPicker(!showPicker)} className={styles.button}>
        <FaSmile size={24} />
      </button>
      {showPicker && (
        <div className={styles.popover}>
          <Picker onEmojiClick={(event, emoji) => onSelectEmoji(emoji.emoji)} />
        </div>
      )}
    </div>
  );
};

export default EmojiPicker;
