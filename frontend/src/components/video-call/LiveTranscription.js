import { useState, useEffect, useRef } from "react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";

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

const LiveTranscription = ({ isEnabled = true, language = defaultLanguage, onTranscription }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lang, setLang] = useState(language);
  const recognitionRef = useRef(null);

  // ✅ Initialize Speech Recognition
  useEffect(() => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      console.warn("Speech Recognition API is not supported in this browser.");
      return;
    }

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognitionRef.current = recognition;
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event) => {
      let newTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        newTranscript += event.results[i][0].transcript + " ";
      }
      setTranscript(newTranscript.trim());
      if (onTranscription) onTranscription(newTranscript.trim());
    };

    return () => recognition.stop();
  }, []);

  // Update recognition language when changed
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang;
    }
  }, [lang]);

  // ✅ Start / Stop Transcription
  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  return (
    <div className="bg-gray-800 p-2 rounded-lg shadow-lg flex flex-col items-center">
      <button
        className={`p-3 rounded-full transition ${
          isListening ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
        }`}
        onClick={toggleListening}
      >
        {isListening ? <FaMicrophoneSlash size={18} /> : <FaMicrophone size={18} />}
      </button>

      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className="mt-2 bg-gray-700 text-white text-sm p-1 rounded"
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>

      {/* ✅ Display Live Captions */}
      {transcript && (
        <p className="mt-2 text-yellow-400 text-sm text-center px-4">{transcript}</p>
      )}
    </div>
  );
};

export default LiveTranscription;
