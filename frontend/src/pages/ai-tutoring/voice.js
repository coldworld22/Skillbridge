import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaMicrophone, FaVolumeUp, FaStop } from "react-icons/fa";

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
    const response = await fetch("/api/ai-voice-tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await response.json();
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
    <div className="p-10 bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">🎙️ AI Voice Tutor</h1>
      <p className="mt-4 text-lg text-gray-300">Ask questions using your voice and get AI-generated verbal responses.</p>
      
      <div className="mt-6 bg-gray-800 p-6 rounded-lg shadow-lg text-center max-w-lg w-full">
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={startListening}
          className={`px-6 py-3 font-semibold text-lg rounded-lg shadow-lg transition w-full flex items-center justify-center gap-2 ${isListening ? "bg-red-500" : "bg-yellow-500 hover:bg-yellow-600"}`}
        >
          {isListening ? <FaStop /> : <FaMicrophone />} {isListening ? "Listening..." : "Start Talking"}
        </motion.button>
        
        {transcript && (
          <div className="mt-6 p-4 bg-gray-700 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-yellow-400">Your Question:</h2>
            <p className="text-gray-300 mt-2">{transcript}</p>
          </div>
        )}
        
        {aiResponse && (
          <div className="mt-6 p-4 bg-gray-700 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-green-400">AI Response:</h2>
            <p className="text-gray-300 mt-2">{aiResponse}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => speakResponse(aiResponse)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-600 transition flex items-center justify-center gap-2"
            >
              <FaVolumeUp /> Hear Response Again
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}