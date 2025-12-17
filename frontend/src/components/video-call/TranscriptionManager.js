// components/video-call/TranscriptionManager.js
import { useEffect, useRef, useState } from "react";
import logger from "@/utils/logger";
import styles from "./TranscriptionManager.module.scss";

const defaultLanguage =
  typeof window !== "undefined"
    ? navigator.language ||
      (navigator.languages && navigator.languages[0]) ||
      "en-US"
    : "en-US";

const TranscriptionManager = ({ currentSpeaker = "Unknown" }) => {
  const [transcripts, setTranscripts] = useState([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      logger.warn("Speech Recognition API not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = defaultLanguage;

    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        }
      }

      if (finalTranscript.trim()) {
        const entry = {
          text: finalTranscript.trim(),
          speaker: currentSpeaker,
          timestamp: new Date().toLocaleTimeString(),
        };
        setTranscripts((prev) => [...prev, entry]);
      }
    };

    recognition.onerror = (e) => logger.error("Transcription error:", e.error);

    recognitionRef.current = recognition;
    recognition.start();

    return () => {
      recognition.stop();
    };
  }, [currentSpeaker]);

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>🧠 Live Transcription</h3>
      <div className={styles.list}>
        {transcripts.map((entry, index) => (
          <div key={index} className={styles.item}>
            <span className={styles.timestamp}>[{entry.timestamp}]</span>{" "}
            <strong className={styles.speaker}>{entry.speaker}:</strong>{" "}
            <span>{entry.text}</span>
          </div>
        ))}
        {transcripts.length === 0 && (
          <p className={styles.timestamp}>No transcription yet</p>
        )}
      </div>
    </div>
  );
};

export default TranscriptionManager;
