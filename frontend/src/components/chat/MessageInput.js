import { useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";
import { FaMicrophone, FaPaperPlane, FaPaperclip, FaSmile } from "react-icons/fa";

const MessageInput = ({ sendMessage }) => {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recording, setRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const mediaRecorderRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // ✅ Ensure `sendMessage` is defined
  if (typeof sendMessage !== "function") {
    console.error("❌ sendMessage function is missing or invalid!");
  }

  // ✅ Handle Sending Messages
  const handleSend = () => {
    if (!message.trim() && !file && !audioBlob) return;

    const newMessage = {
      text: message || "",
      sender: "You",
      timestamp: new Date().toLocaleTimeString(),
      status: "sent",
      image: file ? URL.createObjectURL(file) : null,
      audio: audioBlob ? URL.createObjectURL(audioBlob) : null,
    };

    sendMessage(newMessage);
    setMessage("");
    setFile(null);
    setAudioBlob(null);
    setShowEmojiPicker(false);
  };

  // ✅ Insert Emoji into Text Input
  const handleEmojiClick = (emoji) => {
    setMessage((prev) => prev + emoji.emoji);
  };

  // 🎙️ Start Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        setAudioBlob(audioBlob);
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  // 🎙️ Stop Voice Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // ✅ Close Emoji Picker When Clicking Outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex flex-col bg-gray-700 p-3 rounded-lg">
      <div className="flex items-center gap-2">
        {/* 🎙️ Record Audio Button */}
        <button
          className={`p-2 ${recording ? "bg-red-600" : "bg-gray-600"} rounded`}
          onClick={recording ? stopRecording : startRecording}
        >
          <FaMicrophone className="text-yellow-500" />
        </button>

        {/* 😀 Emoji Picker Button */}
        <div className="relative">
          <button className="p-2 bg-gray-600 rounded" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            <FaSmile className="text-yellow-500" />
          </button>

          {/* 🌟 Emoji Picker */}
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="absolute bottom-[50px] left-0 w-64 bg-gray-800 p-2 rounded-lg shadow-lg z-50 border border-gray-600">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}
        </div>

        {/* 📂 Upload Files Button */}
        <button className="p-2 bg-gray-600 rounded" onClick={() => fileInputRef.current.click()}>
          <FaPaperclip className="text-white" />
        </button>
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="*/*"
          className="hidden" 
          onChange={(e) => setFile(e.target.files[0])} 
        />

        {/* 📝 Text Input */}
        <input 
          type="text" 
          value={message} 
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..." 
          className="w-full p-2 bg-gray-600 text-white rounded-md" 
        />

        {/* 🚀 Send Button */}
        <button className="p-2 bg-green-500 rounded text-white" onClick={handleSend}>
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
