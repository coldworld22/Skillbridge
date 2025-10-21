import { useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";
import { useTranslation } from "next-i18next";
import {
  FaMicrophone,
  FaPaperPlane,
  FaPaperclip,
  FaSmile,
  FaTimes,
} from "react-icons/fa";

const MessageInput = ({ sendMessage, replyTo, onCancelReply, onTyping }) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recording, setRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [sendWhatsapp, setSendWhatsapp] = useState(false);

  const mediaRecorderRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const typingTimeout = useRef(null);

  const handleSend = () => {
    if (!message.trim() && !file && !audioBlob) return;

    const newMessage = {
      text: message.trim(),
      file,
      audio: audioBlob,
      sendEmail,
      sendWhatsapp,
    };

    sendMessage(newMessage);
    setMessage("");
    setFile(null);
    setAudioBlob(null);
    setSendEmail(false);
    setSendWhatsapp(false);
    setShowEmojiPicker(false);
    onCancelReply?.();
    onTyping?.(false);
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
    <div className="relative rounded-lg border border-gray-200 bg-white px-3 py-3 shadow-sm">
      {/* Reply Preview */}
      {replyTo && (
        <div className="mb-3 flex items-start justify-between rounded border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm">
          <span className="truncate italic text-yellow-700">
            Replying to: “{replyTo.message || replyTo.file_url?.split("/").pop() || "audio"}”
          </span>
          <button onClick={onCancelReply} className="ml-2 text-yellow-700 hover:text-yellow-600">
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
            className={`flex h-9 w-9 items-center justify-center rounded-md border transition ${
              recording ? "border-red-200 bg-red-100" : "border-gray-200 bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <FaMicrophone className={recording ? "text-red-600" : "text-yellow-600"} />
          </button>

          {/* Emoji */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-gray-50 transition hover:bg-gray-100"
            >
              <FaSmile className="text-yellow-500" />
            </button>
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-[50px] left-0 z-50 w-72 rounded-lg border border-gray-200 bg-white shadow-lg"
              >
                <EmojiPicker onEmojiClick={handleEmojiClick} theme="light" />
              </div>
            )}
          </div>

          {/* Attachment */}
          <button
            onClick={() => fileInputRef.current.click()}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-gray-50 transition hover:bg-gray-100"
          >
            <FaPaperclip className="text-gray-600" />
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
          onChange={(e) => {
            setMessage(e.target.value);
            onTyping?.(true);
            clearTimeout(typingTimeout.current);
            typingTimeout.current = setTimeout(() => onTyping?.(false), 1500);
          }}
          placeholder={t("type_message_placeholder")}
          className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
        />

        {/* Send */}
        <button
          onClick={handleSend}
          className="flex h-9 w-9 items-center justify-center rounded-md bg-yellow-500 text-gray-900 transition hover:bg-yellow-400"
        >
          <FaPaperPlane />
        </button>
      </div>

      <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
          />
          Email
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={sendWhatsapp}
            onChange={(e) => setSendWhatsapp(e.target.checked)}
          />
          WhatsApp
        </label>
      </div>

      {/* File name preview */}
      {file && (
        <div className="mt-1 truncate text-xs text-gray-500">
          📎 Attached: <span className="italic">{file.name}</span>
        </div>
      )}
    </div>
  );
};

export default MessageInput;
