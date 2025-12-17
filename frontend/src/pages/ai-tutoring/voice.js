import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaMicrophone, FaVolumeUp, FaStop } from "react-icons/fa";
import api from "@/services/api/api";
import styles from "./ai.module.scss";

export default function AIVoiceTutor() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState(null);
  const [speechSynthesis, setSpeechSynthesis] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, []);

  const startListening = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.start();

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      fetchAIResponse(text);
    };
  };

  const fetchAIResponse = async (query) => {
    const { data } = await api.post("/ai-voice-tutor", { query });
    setAiResponse(data.response);
    speakResponse(data.response);
  };

  const speakResponse = (text) => {
    if (speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className={styles.page} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div className={`${styles.container} ${styles.narrow}`} style={{ textAlign: "center" }}>
        <h1 className={styles.title}>🎙️ AI Voice Tutor</h1>
        <p className={styles.subtitle}>Ask questions using your voice and get AI-generated verbal responses.</p>
      </div>
      
      <div className={`${styles.card} ${styles.cardMuted}`} style={{ marginTop: "1.5rem", maxWidth: "30rem", width: "100%", textAlign: "center" }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={startListening}
          className={`${styles.btn} ${isListening ? styles.btnSecondary : styles.btnPrimary}`}
          style={{ width: "100%" }}
        >
          {isListening ? <FaStop /> : <FaMicrophone />} {isListening ? "Listening..." : "Start Talking"}
        </motion.button>
        
        {transcript && (
          <div className={styles.card} style={{ marginTop: "1rem" }}>
            <h2 className={styles.sectionTitle}>Your Question:</h2>
            <p className={styles.text}>{transcript}</p>
          </div>
        )}
        
        {aiResponse && (
          <div className={styles.card} style={{ marginTop: "1rem" }}>
            <h2 className={styles.sectionTitle} style={{ color: "#34d399" }}>AI Response:</h2>
            <p className={styles.text}>{aiResponse}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => speakResponse(aiResponse)}
              className={`${styles.btn} ${styles.btnSecondary}`}
              style={{ marginTop: "0.75rem" }}
            >
              <FaVolumeUp /> Hear Response Again
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
