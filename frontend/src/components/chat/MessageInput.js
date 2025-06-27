import { useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";
import {
  FaMicrophone,
  FaPaperPlane,
  FaPaperclip,
  FaSmile,
  FaTimes,
} from "react-icons/fa";

const MessageInput = ({ sendMessage, replyTo, onCancelReply }) => {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recording, setRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const mediaRecorderRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const handleSend = () => {
    if (!message.trim() && !file && !audioBlob) return;

    const newMessage = {
      text: message.trim(),
      file,
      audio: audioBlob ? new File([audioBlob], `record-${Date.now()}.webm`) : null,
    };
    sendMessage(newMessage);
    setMessage("");
    setFile(null);
    setAudioBlob(null);
    setShowEmojiPicker(false);
    onCancelReply?.();
  };

  const handleEmojiClick = (emoji) => {
    setMessage((prev) => prev + emoji.emoji);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        setAudioBlob(blob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (err) {
      console.error("Microphone error:", err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  useEffect(() => {
    const closeEmojiPicker = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", closeEmojiPicker);
    return () => document.removeEventListener("mousedown", closeEmojiPicker);
  }, []);

  return (
    <div className="relative bg-gray-800/80 backdrop-blur-md px-3 py-2 border-t border-gray-700 rounded-b-xl shadow-inner">
      {/* Reply Preview */}
      {replyTo && (
        <div className="mb-2 px-3 py-2 bg-gray-700 border-l-4 border-yellow-400 rounded flex justify-between items-start text-sm text-yellow-300 shadow-sm">
          <span className="italic truncate">Replying to: “{replyTo.text}”</span>
          <button onClick={onCancelReply} className="ml-2 text-red-400 hover:text-red-600">
            <FaTimes size={12} />
          </button>
        </div>
      )}

      {/* Controls Row */}
      <div className="flex items-center gap-2">
        {/* Button Group */}
        <div className="flex items-center gap-1">
          {/* Audio */}
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`h-8 w-8 flex items-center justify-center rounded-md transition-all duration-200 ${
              recording ? "bg-red-600" : "bg-gray-700 hover:bg-gray-600"
            } shadow-sm`}
          >
            <FaMicrophone className="text-yellow-400 text-sm" />
          </button>

          {/* Emoji */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="h-8 w-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-md shadow-sm"
            >
              <FaSmile className="text-yellow-400 text-sm" />
            </button>
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-[50px] left-0 z-50 w-72 bg-gray-900 border border-gray-700 rounded-lg shadow-lg"
              >
                <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" />
              </div>
            )}
          </div>

          {/* Attachment */}
          <button
            onClick={() => fileInputRef.current.click()}
            className="h-8 w-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-md shadow-sm"
          >
            <FaPaperclip className="text-white text-xs" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => setFile(e.target.files[0])}
            className="hidden"
          />
        </div>

        {/* Text Input */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-2 py-[2px] text-xs bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-[1px] focus:ring-yellow-400 shadow-sm"
        />

        {/* Send */}
       <button
          onClick={handleSend}
          className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-md"
        >
          <FaPaperPlane />
        </button>
      </div>

      {/* File name preview */}
      {file && (
        <div className="text-xs text-gray-400 mt-1 truncate">
          📎 Attached: <span className="italic">{file.name}</span>
        </div>
      )}
    </div>
  );
};

export default MessageInput;
