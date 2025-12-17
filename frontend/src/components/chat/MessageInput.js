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
import { toast } from "react-toastify";
import styles from "./ChatInputs.module.scss";

const MessageInput = ({ sendMessage, replyTo, onCancelReply, onTyping }) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordingBlocked, setRecordingBlocked] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [sendWhatsapp, setSendWhatsapp] = useState(false);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const typingTimeout = useRef(null);

  const handleSend = () => {
    if (!message.trim() && !file && !audioFile) return;

    const newMessage = {
      text: message.trim(),
      file,
      audio: audioFile,
      sendEmail,
      sendWhatsapp,
    };

    sendMessage(newMessage);
    setMessage("");
    setFile(null);
    setAudioFile(null);
    setSendEmail(false);
    setSendWhatsapp(false);
    setRecordingBlocked(false);
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
      mediaStreamRef.current = stream;
      const options = { mimeType: "audio/webm" };
      let recorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (_err) {
        recorder = new MediaRecorder(stream);
      }
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const mimeType =
          recorder.mimeType ||
          chunks[0]?.type ||
          "audio/webm";
        const extension = mimeType.includes("wav")
          ? "wav"
          : mimeType.includes("ogg")
          ? "ogg"
          : "webm";
        const blob = new Blob(chunks, { type: mimeType });
        const fileName = `recording-${Date.now()}.${extension}`;
        const fileObject = new File([blob], fileName, { type: mimeType });
        setAudioFile(fileObject);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (err) {
      console.error("Microphone error:", err);
      setRecording(false);
      setRecordingBlocked(true);
      const message =
        err.name === "NotAllowedError"
          ? t("microphone_permission_denied", {
              defaultValue:
                "Microphone access was blocked. Please allow microphone permissions in your browser settings.",
            })
          : t("microphone_unavailable", {
              defaultValue: "Unable to access the microphone. Please try again.",
            });
      toast.error(message);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaStreamRef.current?.getTracks?.().forEach((track) => track.stop());
    mediaStreamRef.current = null;
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
    <div className={styles.messageBox}>
      {/* Reply Preview */}
      {replyTo && (
        <div className={styles.replyBar}>
          <span className={styles.replyText}>
            Replying to: “{replyTo.message || replyTo.file_url?.split("/").pop() || "audio"}”
          </span>
          <button onClick={onCancelReply} className={styles.iconButton}>
            <FaTimes size={12} />
          </button>
        </div>
      )}

      {/* Controls Row */}
      <div className={styles.controls}>
        {/* Button Group */}
        <div className={styles.actionGroup}>
          {/* Audio */}
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={recordingBlocked}
            className={styles.iconButton}
            style={
              recording
                ? { borderColor: "#fecdd3", background: "#fee2e2" }
                : recordingBlocked
                ? { opacity: 0.6, cursor: "not-allowed" }
                : undefined
            }
          >
            <FaMicrophone className={recording ? styles.iconDanger : styles.iconYellow} />
          </button>

          {/* Emoji */}
          <div className={styles.emojiWrapper}>
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={styles.iconButton}
            >
              <FaSmile className={styles.iconYellow} />
            </button>
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className={styles.emojiPopover}
              >
                <EmojiPicker onEmojiClick={handleEmojiClick} theme="light" />
              </div>
            )}
          </div>

          {/* Attachment */}
          <button
            onClick={() => fileInputRef.current.click()}
            className={styles.iconButton}
          >
            <FaPaperclip className={styles.iconGray} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => setFile(e.target.files[0])}
            className={styles.hiddenInput}
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
          className={styles.textInput}
        />

        {/* Send */}
        <button
          onClick={handleSend}
          className={styles.sendButton}
        >
          <FaPaperPlane />
        </button>
      </div>

      <div className={styles.checkboxRow}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
          />
          Email
        </label>
        <label className={styles.checkboxLabel}>
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
        <div className={styles.attachment}>
          📎 Attached: <span className={styles.attachmentName}>{file.name}</span>
        </div>
      )}
    </div>
  );
};

export default MessageInput;
