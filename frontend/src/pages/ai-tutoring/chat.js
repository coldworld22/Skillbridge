import { useState, useEffect } from "react";
import { askAI } from "@/services/aiService";
import { fetchThirdPartyConfig } from "@/services/thirdPartyService";
import { computeAvailableProviders } from "@/utils/aiProviders";
import { toast } from "react-toastify";
import styles from "./ai.module.scss";

export default function AIChatTutorPage() {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const cfg = await fetchThirdPartyConfig();
        const { providers, defaultProvider } = computeAvailableProviders(cfg);
        setModels(providers);
        setSelectedModel(defaultProvider || "");
        if (!providers.length) {
          setMessages((prev) => [
            ...prev,
            {
              sender: "ai",
              text: "AI chat is unavailable. Please configure a provider in the admin dashboard.",
            },
          ]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    if (!selectedModel) {
      toast.warning("Select an AI provider before sending a message.");
      return;
    }
    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const { answer } = await askAI(selectedModel, userMessage.text);
      const aiReply = { sender: "ai", text: answer?.trim() || "No answer received." };
      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      const message = err?.message || "Error fetching response";
      toast.error(message);
      setMessages((prev) => [...prev, { sender: "ai", text: message }]);
    }
  };

  return (
    <div className={styles.page}>
      <div className={`${styles.container} ${styles.narrow}`}>
        <h1 className={styles.title}>💬 AI Chat Tutor</h1>
        <p className={styles.subtitle}>Ask questions and get instant responses from your AI tutor.</p>
      </div>
      <div className={`${styles.container} ${styles.narrow} ${styles.chatContainer}`}>
        {/* Model Selector */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          {models.map((model) => (
            <label key={model.key} className={styles.radioRow}>
              <input
                type="radio"
                name="model"
                value={model.key}
                checked={selectedModel === model.key}
                onChange={() => setSelectedModel(model.key)}
                className={styles.radioInput}
              />
              {model.label}
            </label>
          ))}
          {!models.length && (
            <span className={styles.callout}>
              No AI provider configured.
            </span>
          )}
        </div>

        {/* Chat History */}
        <div className={styles.chatMessages}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`${styles.message} ${msg.sender === "user" ? styles.card : ""}`}
              style={{ alignSelf: msg.sender === "user" ? "flex-end" : "flex-start", maxWidth: "80%" }}
            >
              {msg.text}
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div className={styles.messageForm}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask your AI tutor..."
            className={styles.input}
          />
          <button
            onClick={sendMessage}
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
