import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaThumbsUp, FaHeart, FaLaugh, FaFire, FaStar } from "react-icons/fa";
import socket from "@/services/socketService";
import styles from "./EmojiReactions.module.scss";

const EmojiReactions = ({ roomId }) => {
  const [reactions, setReactions] = useState([]);

  useEffect(() => {
    if (!roomId) return undefined;
    const handleReaction = (payload) => {
      if (payload?.roomId !== roomId) return;
      const id = payload.id || Date.now();
      setReactions((prev) => [...prev, { id, emoji: payload.emoji }]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((reaction) => reaction.id !== id));
      }, 2000);
    };
    socket.on("emoji-reaction", handleReaction);
    return () => socket.off("emoji-reaction", handleReaction);
  }, [roomId]);

  const sendReaction = (emoji) => {
    if (!roomId) return;
    socket.emit("emoji-reaction", { roomId, emoji });
  };

  return (
    <div className={styles.container}>
      {/* Floating Emoji Reactions */}
      <AnimatePresence>
        {reactions.map(({ id, emoji }) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: -50, scale: 1.2 }}
            exit={{ opacity: 0, y: -80 }}
            transition={{ duration: 1.5 }}
            className={styles.float}
            style={{ left: `${Math.random() * 80 + 10}%`, bottom: "10%" }}
          >
            {emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Reaction Bar */}
      <div className={styles.bar}>
        <button className={`${styles.button} ${styles.yellow}`} onClick={() => sendReaction("👍")}>
          <FaThumbsUp size={24} />
        </button>
        <button className={`${styles.button} ${styles.red}`} onClick={() => sendReaction("❤️")}>
          <FaHeart size={24} />
        </button>
        <button className={`${styles.button} ${styles.yellow}`} onClick={() => sendReaction("😂")}>
          <FaLaugh size={24} />
        </button>
        <button className={`${styles.button} ${styles.orange}`} onClick={() => sendReaction("🔥")}>
          <FaFire size={24} />
        </button>
        <button className={`${styles.button} ${styles.blue}`} onClick={() => sendReaction("⭐")}>
          <FaStar size={24} />
        </button>
      </div>
    </div>
  );
};

export default EmojiReactions;
