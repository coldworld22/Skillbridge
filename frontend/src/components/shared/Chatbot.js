import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { askAI } from "@/services/aiService";
import { fetchThirdPartyConfig } from "@/services/thirdPartyService";
import { computeAvailableProviders } from "@/utils/aiProviders";
import styles from "./Chatbot.module.scss";

const Chatbot = ({ isOpen, onToggle }) => {
  const [messages, setMessages] = useState([
    { sender: "ai", text: "👋 Hi! How can I assist you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [providers, setProviders] = useState([]);
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const load = async () => {
      try {
        const cfg = await fetchThirdPartyConfig();
        if (cancelled) return;
        const { providers: available, defaultProvider } =
          computeAvailableProviders(cfg);
        setProviders(available);
        setProvider(defaultProvider);
        if (!available.length) {
          setError(
            "No AI provider is active. Please configure ChatGPT, DeepSeek, or Gemini in the admin settings."
          );
        } else {
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.message || "Failed to load AI configuration. Try again later."
          );
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question) return;
    if (!provider) {
      setError(
        "AI assistant is unavailable because no provider is configured."
      );
      return;
    }

    const userMsg = { sender: "user", text: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const { answer } = await askAI(provider, question);
      const text = answer?.trim();
      if (text) {
        setMessages((prev) => [...prev, { sender: "ai", text }]);
      } else {
        setError("No response received from the AI service.");
      }
    } catch (err) {
      setError(err?.message || "Failed to fetch response");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay Background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className={styles.overlay}
            onClick={() => onToggle(false)}
          />

          {/* Chatbot Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className={styles.panel}
          >
            {/* Header */}
            <div className={styles.header}>
              <h3 className={styles.title}>AI Assistant</h3>
              <button
                onClick={() => onToggle(false)}
                className={styles.close}
              >
                <FaTimes className={styles.closeIcon} />
              </button>
            </div>
            {providers.length > 1 && (
              <div className={styles.provider}>
                Powered by{" "}
                <select
                  value={provider || ""}
                  onChange={(e) => setProvider(e.target.value)}
                  className={styles.providerSelect}
                >
                  {providers.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Chat Area */}
            <div className={styles.chatArea}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`${styles.bubble} ${
                    msg.sender === "user" ? styles.bubbleUser : styles.bubbleAI
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {loading && (
                <div className={styles.muted}>Thinking...</div>
              )}
              {error && <div className={styles.error}>{error}</div>}
            </div>

            {/* Input Field */}
            <form onSubmit={handleSubmit} className={styles.inputForm}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className={styles.input}
              />
              {error && (
                <p className={styles.muted}>
                  Check that the preferred AI integration is active and configured in Settings →
                  Third Party.
                </p>
              )}
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Chatbot;
