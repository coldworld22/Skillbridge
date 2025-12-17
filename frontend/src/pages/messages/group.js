import Navbar from "@/components/website/sections/Navbar";
import { useState } from "react";
import { motion } from "framer-motion";
import formatRelativeTime from "@/utils/relativeTime";
import { FaUsers, FaPlus, FaComments, FaPaperPlane } from "react-icons/fa";
import styles from "./messages.module.scss";

const GroupChat = () => {
  const [groupMessages, setGroupMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Handle sending message
  const handleSendMessage = () => {
    if (newMessage.trim() === "") return;

    const newMsg = {
      id: groupMessages.length + 1,
      sender: "You",
      text: newMessage,
      timestamp: new Date().toISOString()
    };

    setGroupMessages([...groupMessages, newMsg]);
    setNewMessage("");
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <h1 className={styles.title} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FaUsers /> Group Chat
        </h1>

        <div className={styles.card} style={{ marginTop: "1rem", minHeight: "300px", display: "flex", flexDirection: "column" }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={styles.chatMessages}
          >
            {groupMessages.length === 0 ? (
              <p className={styles.subtitle}>No messages yet.</p>
            ) : (
              groupMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={styles.bubble}
                >
                  <p className={styles.heading}>{msg.sender}</p>
                  <p>{msg.text}</p>
                  <p className={styles.subtitle}>{formatRelativeTime(msg.timestamp)}</p>
                </motion.div>
              ))
            )}
          </motion.div>

          <div className={styles.messageForm} style={{ marginTop: "0.75rem" }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className={styles.input}
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSendMessage}
              className={`${styles.button} ${styles.buttonSecondary}`}
            >
              <FaPaperPlane />
            </motion.button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GroupChat;

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
