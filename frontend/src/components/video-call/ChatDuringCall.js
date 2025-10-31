import { useState, useEffect, useRef } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { fetchCallMessages, sendCallMessage } from "@/services/videoCallService";
import socket from "@/services/socketService";
import { toast } from "react-toastify";

const normalizeMessage = (raw = {}) => {
  const flagMetadata =
    (raw.flag_metadata || raw.flagMetadata || {}) && typeof (raw.flag_metadata || raw.flagMetadata) === "object"
      ? raw.flag_metadata || raw.flagMetadata || {}
      : {};
  const inferredSeverity =
    raw.flag_severity ||
    raw.flagSeverity ||
    flagMetadata.severity ||
    (flagMetadata.matches?.[0]?.severity ?? null);
  const inferredStatus =
    raw.moderation_status ||
    raw.moderationStatus ||
    (raw.is_flagged || raw.isFlagged ? "pending_review" : "visible");

  const message = {
    ...raw,
    is_flagged: Boolean(raw.is_flagged ?? raw.isFlagged),
    flag_severity: inferredSeverity,
    moderation_status: inferredStatus,
    flag_metadata: flagMetadata,
  };

  if (typeof message.redacted === "undefined") {
    message.redacted = inferredStatus === "blocked";
  }

  return message;
};

const isHostRole = (role) => role === "host" || role === "co-host";

const ChatDuringCall = ({ chatId, currentUserId, userRole = "participant" }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const isHost = isHostRole(userRole);

  useEffect(() => {
    if (!chatId) return;

    let active = true;

    fetchCallMessages(chatId)
      .then((data) => {
        if (active) {
          setMessages(
            Array.isArray(data) ? data.map((item) => normalizeMessage(item)) : []
          );
        }
      })
      .catch(() => {
        if (active) setMessages([]);
      });

    if (!socket.connected) socket.connect();

    const handleMessage = (msg) => {
      if (msg?.room_id !== chatId) return;
      setMessages((prev) => [...prev, normalizeMessage(msg)]);
    };

    const handleFlagged = (payload) => {
      if (payload?.roomId !== chatId || !payload?.messageId) return;
      setMessages((prev) =>
        prev.map((message) => {
          if (message.id !== payload.messageId) return message;
          const updated = normalizeMessage({
            ...message,
            is_flagged: true,
            flag_severity: payload.severity ?? message.flag_severity,
            moderation_status:
              payload.moderation_status ?? message.moderation_status,
            flag_metadata: {
              ...message.flag_metadata,
              ...(payload.flag_metadata || {}),
            },
            redacted:
              payload.autoActionTaken ||
              payload.moderation_status === "blocked" ||
              message.redacted,
          });
          return updated;
        })
      );
      if (isHost) {
        toast.warn(
          `Message flagged (${(payload?.severity || "review").toUpperCase()})`,
          { toastId: `flag-${payload.messageId}` }
        );
      }
    };

    const handleFlagStatusUpdated = (payload) => {
      if (payload?.contextId !== chatId || !payload?.messageId) return;
      setMessages((prev) =>
        prev.map((message) => {
          if (message.id !== payload.messageId) return message;
          const updated = normalizeMessage({
            ...message,
            is_flagged:
              payload.isFlagged !== undefined
                ? payload.isFlagged
                : message.is_flagged,
            moderation_status:
              payload.messageStatus ?? message.moderation_status,
            flag_metadata: {
              ...message.flag_metadata,
              ...(payload.flagMetadata || {}),
            },
          });
          updated.redacted =
            updated.moderation_status === "blocked"
              ? true
              : updated.moderation_status === "visible"
              ? false
              : updated.redacted;
          return updated;
        })
      );
    };

    socket.on("call-message", handleMessage);
    socket.on("call-message-flagged", handleFlagged);
    socket.on("call-message-flag-updated", handleFlagStatusUpdated);

    return () => {
      active = false;
      socket.off("call-message", handleMessage);
      socket.off("call-message-flagged", handleFlagged);
      socket.off("call-message-flag-updated", handleFlagStatusUpdated);
    };
  }, [chatId, isHost, userRole]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async () => {
    const text = newMessage.trim();
    if (!text) return;
    try {
      await sendCallMessage(chatId, { text });
    } catch (err) {
      toast.error("Failed to send message");
    }
    setNewMessage("");
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-lg font-bold text-yellow-500">💬 Chat</h3>
      <div className="max-h-48 overflow-y-auto space-y-2 my-3 pr-2">
        {messages.map((msg, index) => (
          <MessageBubble
            key={msg.id || index}
            msg={msg}
            currentUserId={currentUserId}
            isHost={isHost}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-2 bg-gray-700 text-white rounded-md"
        />
        <button className="p-2 bg-green-500 rounded text-white" onClick={sendMessage}>
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

/* 🛠️ Utility Component for Chat Bubbles */
const severityBadgeClasses = (severity) => {
  const key = (severity || "").toLowerCase();
  switch (key) {
    case "critical":
      return "bg-red-600 text-white";
    case "high":
      return "bg-orange-500 text-white";
    case "medium":
      return "bg-yellow-400 text-gray-900";
    case "low":
      return "bg-blue-500 text-white";
    default:
      return "bg-red-300 text-red-900";
  }
};

const MessageBubble = ({ msg, currentUserId, isHost }) => {
  const isSelf =
    (msg.sender_id && msg.sender_id === currentUserId) ||
    (!msg.sender_id && msg.sender === "You");
  const senderLabel = isSelf ? "You" : msg.sender || "Participant";
  const flagged =
    Boolean(msg.is_flagged) || msg.moderation_status !== "visible";
  const severity = msg.flag_severity || msg.flagSeverity || null;
  const blocked = msg.moderation_status === "blocked";
  const displayText =
    flagged && blocked && !isHost && !isSelf
      ? "🚫 Message hidden pending review"
      : msg.text;
  const bubbleClasses = [
    "p-2 rounded-lg max-w-xs border",
    isSelf ? "bg-yellow-500 text-gray-900 ml-auto" : "bg-gray-700",
  ];
  if (flagged) {
    bubbleClasses.push("border-red-500 shadow-md");
  } else {
    bubbleClasses.push("border-transparent");
  }

  return (
    <div className={bubbleClasses.join(" ")}>
      <div className="flex items-center justify-between gap-2">
        <strong>{senderLabel}</strong>
        {flagged && (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${severityBadgeClasses(
              severity
            )}`}
          >
            {severity ? severity.toUpperCase() : "FLAGGED"}
          </span>
        )}
      </div>
      <p
        className={`${
          flagged && blocked && !isHost && !isSelf
            ? "italic text-gray-200"
            : ""
        }`}
      >
        {displayText}
      </p>
      {isHost && flagged && msg.flag_metadata?.reason && (
        <p className="mt-1 text-[11px] text-red-200">
          {msg.flag_metadata.reason}
        </p>
      )}
      {isHost &&
        flagged &&
        Array.isArray(msg.flag_metadata?.matches) &&
        msg.flag_metadata.matches.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {msg.flag_metadata.matches.slice(0, 3).map((match, index) => {
              const label =
                match.term || match.label || match.ruleId || match || "match";
              return (
                <span
                  key={`${msg.id || "match"}-${index}`}
                  className="px-2 py-0.5 bg-red-200 text-red-800 rounded-full text-[10px]"
                >
                  {label}
                </span>
              );
            })}
          </div>
        )}
      {isHost &&
        flagged &&
        msg.flag_metadata?.repeat_offender &&
        (msg.flag_metadata.repeat_offenses || msg.flag_metadata.repeat_counts) && (
          <p className="mt-1 text-[10px] text-orange-200">
            Repeat offender (
            {msg.flag_metadata.repeat_offenses ||
              msg.flag_metadata.repeat_counts}
            )
          </p>
        )}
    </div>
  );
};

export default ChatDuringCall;
