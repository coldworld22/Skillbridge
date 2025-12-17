import { useState, useEffect, useRef, useCallback } from "react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { toast } from "react-toastify";
import logger from "@/utils/logger";
import styles from "./LiveTranscription.module.scss";

const defaultLanguage =
  typeof window !== "undefined"
    ? navigator.language ||
      (navigator.languages && navigator.languages[0]) ||
      "en-US"
    : "en-US";

const languages = [
  { code: "en-US", label: "English" },
  { code: "es-ES", label: "Spanish" },
  { code: "fr-FR", label: "French" },
  { code: "de-DE", label: "German" },
  { code: "zh-CN", label: "Chinese" },
  { code: "ar-SA", label: "Arabic" },
  { code: "hi-IN", label: "Hindi" },
];

const LiveTranscription = ({ isEnabled = false, language = defaultLanguage, onTranscription }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lang, setLang] = useState(language);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);
  }, []);

  const teardownRecognition = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.onstart = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onresult = null;
      recognitionRef.current.stop();
    } catch (err) {
      logger.warn("Failed to stop speech recognition cleanly", err);
    }
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  // Initialize Speech Recognition only when explicitly enabled
  useEffect(() => {
    if (!isEnabled) {
      teardownRecognition();
      setTranscript("");
      return;
    }
    if (typeof window === "undefined") return;
    const RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      setIsSupported(false);
      toast.warn("Live captions are not supported in this browser.");
      return;
    }
    const recognition = new RecognitionCtor();
    recognitionRef.current = recognition;
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      let newTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i]?.[0]?.transcript) {
          newTranscript += `${event.results[i][0].transcript} `;
        }
      }
      const trimmed = newTranscript.trim();
      setTranscript(trimmed);
      if (onTranscription) onTranscription(trimmed);
    };

    recognition.onerror = (event) => {
      const { error } = event || {};
      setIsListening(false);
      if (error === "no-speech") {
        toast.info("We didn't catch any speech. Try speaking closer to the microphone.");
      } else if (error === "audio-capture") {
        toast.error("No microphone was detected. Please connect one and try again.");
      } else if (error === "not-allowed") {
        toast.error("Microphone permission denied. Allow access in your browser settings to enable captions.");
      } else if (error && error !== "aborted") {
        toast.error("Live transcription hit an unexpected error. Please retry.");
      }
      if (error !== "aborted") {
        logger.warn("Transcription error:", event);
      }
    };

    return () => {
      teardownRecognition();
    };
  }, [isEnabled, lang, onTranscription, teardownRecognition]);

  // Update recognition language when changed
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang;
    }
  }, [lang]);

  // ✅ Start / Stop Transcription
  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      if (!isSupported) {
        toast.warn("Live captions are not available in this browser.");
      }
      return;
    }
    if (isListening) {
      try {
        recognition.stop();
      } catch (err) {
        logger.warn("Failed to stop transcription", err);
      }
    } else {
      try {
        recognition.start();
      } catch (err) {
        const reason =
          err?.name === "NotAllowedError"
            ? "Microphone permission was blocked. Enable access and try again."
            : "We couldn't start live captions. Ensure no other app is locking your microphone.";
        toast.error(reason);
        logger.error("Failed to start live transcription", err);
      }
    }
  };

  if (!isEnabled) {
    return null;
  }

  return (
    <div className={styles.card}>
      <button
        className={`${styles.toggle} ${isListening ? styles.listening : styles.notListening}`}
        onClick={toggleListening}
        type="button"
      >
        {isListening ? <FaMicrophoneSlash size={18} /> : <FaMicrophone size={18} />}
      </button>

      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className={styles.lang}
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>

      {/* ✅ Display Live Captions */}
      {transcript && (
        <p className={styles.transcript}>{transcript}</p>
      )}
    </div>
  );
};

export default LiveTranscription;
