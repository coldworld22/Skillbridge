import { useState, useEffect } from "react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";

const LiveTranscription = ({ isEnabled, language = "en-US", onTranscription }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  let recognition = null;

  // ✅ Initialize Speech Recognition
  useEffect(() => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      console.warn("Speech Recognition API is not supported in this browser.");
      return;
    }

    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = language;
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
  }, [language]);

  // ✅ Start / Stop Transcription
  const toggleListening = () => {
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

      {/* ✅ Display Live Captions */}
      {transcript && (
        <p className="mt-2 text-yellow-400 text-sm text-center px-4">{transcript}</p>
      )}
    </div>
  );
};

export default LiveTranscription;
