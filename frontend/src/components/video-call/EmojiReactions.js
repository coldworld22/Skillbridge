import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaThumbsUp, FaHeart, FaLaugh, FaFire, FaStar } from "react-icons/fa";

const EmojiReactions = () => {
  const [reactions, setReactions] = useState([]);

  const sendReaction = (emoji) => {
    const id = Date.now();
    setReactions((prev) => [...prev, { id, emoji }]);

    // Remove the emoji after 2 seconds
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2000);
  };

  return (
    <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
      {/* Floating Emoji Reactions */}
      <AnimatePresence>
        {reactions.map(({ id, emoji }) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: -50, scale: 1.2 }}
            exit={{ opacity: 0, y: -80 }}
            transition={{ duration: 1.5 }}
            className="absolute text-3xl"
            style={{ left: `${Math.random() * 80 + 10}%`, bottom: "10%" }}
          >
            {emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Reaction Bar */}
      <div className="flex space-x-4 bg-gray-800 p-3 rounded-full shadow-lg">
        <button className="p-3 text-yellow-500 hover:scale-125 transition" onClick={() => sendReaction("👍")}>
          <FaThumbsUp size={24} />
        </button>
        <button className="p-3 text-red-500 hover:scale-125 transition" onClick={() => sendReaction("❤️")}>
          <FaHeart size={24} />
        </button>
        <button className="p-3 text-yellow-400 hover:scale-125 transition" onClick={() => sendReaction("😂")}>
          <FaLaugh size={24} />
        </button>
        <button className="p-3 text-orange-500 hover:scale-125 transition" onClick={() => sendReaction("🔥")}>
          <FaFire size={24} />
        </button>
        <button className="p-3 text-blue-400 hover:scale-125 transition" onClick={() => sendReaction("⭐")}>
          <FaStar size={24} />
        </button>
      </div>
    </div>
  );
};

export default EmojiReactions;
