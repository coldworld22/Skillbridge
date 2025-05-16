// components/video-call/TranscriptionManager.js
import { useEffect, useRef, useState } from "react";

const TranscriptionManager = ({ currentSpeaker = "Unknown" }) => {
  const [transcripts, setTranscripts] = useState([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech Recognition API not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

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

    recognition.onerror = (e) => console.error("Transcription error:", e.error);

    recognitionRef.current = recognition;
    recognition.start();

    return () => {
      recognition.stop();
    };
  }, [currentSpeaker]);

  return (
    <div className="absolute bottom-20 left-6 bg-black/60 p-4 rounded-lg max-w-md text-sm overflow-y-auto h-[160px]">
      <h3 className="text-yellow-400 font-semibold mb-2">🧠 Live Transcription</h3>
      <div className="space-y-1 max-h-[120px] overflow-y-scroll">
        {transcripts.map((entry, index) => (
          <div key={index}>
            <span className="text-gray-400">[{entry.timestamp}]</span>{" "}
            <strong className="text-yellow-300">{entry.speaker}:</strong>{" "}
            <span>{entry.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TranscriptionManager;
