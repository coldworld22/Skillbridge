import { FaEnvelope } from "react-icons/fa";
import { API_BASE_URL } from "@/config/config";
import formatRelativeTime from "@/utils/relativeTime";
import dayjs from "dayjs";
import ChatImage from "../shared/ChatImage";
import styles from "./ChatHeader.module.scss";

const ChatHeader = ({ selectedChat }) => {
  const getAvatarUrl = (url, fallback = "/images/default-avatar.png") => {
    if (!url) return fallback;
    if (url.startsWith("http") || url.startsWith("blob:")) return url;
    return `${API_BASE_URL}${url}`;
  };

  if (!selectedChat) {
    return <div className={styles.placeholder}>No chat selected</div>;
  }

  const avatar = selectedChat.isGroup
    ? selectedChat.cover_image || selectedChat.image
    :
        selectedChat.profileImage ||
        selectedChat.profile_image ||
        selectedChat.avatar_url;

  const isOnline =
    selectedChat.isOnline ?? selectedChat.is_online ?? selectedChat.status === "online";
  const lastActiveRaw = selectedChat.lastActive || selectedChat.last_active;
  const email = selectedChat.email;

  const formatLastActive = () => {
    if (!lastActiveRaw) return "";
    const date = dayjs(lastActiveRaw);
    if (!date.isValid()) return "";
    const absolute = date.format("YYYY-MM-DD HH:mm");
    const relative = formatRelativeTime(lastActiveRaw);
    return relative ? `${absolute} (${relative})` : absolute;
  };
  const lastActiveLabel = formatLastActive();

  const handleSendEmail = () => {
    if (email) {
      window.location.href = `mailto:${email}?subject=Let's Chat&body=Hello!`;
    } else {
      alert("Email is missing!");
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.left}>
        <div className={styles.avatarWrap}>
          <ChatImage
            src={getAvatarUrl(
              avatar,
              selectedChat.isGroup ? "/images/group-placeholder.jpg" : undefined
            )}
            alt="avatar"
            className={styles.avatar}
            width={40}
            height={40}
          />
          {!selectedChat.isGroup && (
            <span
              className={`${styles.statusDot} ${isOnline ? styles.statusOnline : ""}`}
            />
          )}
        </div>
        <div>
          <h3 className={styles.title}>
            {selectedChat.groupName || selectedChat.name || selectedChat.full_name || "Conversation"}
          </h3>
          {!selectedChat.isGroup && (
            <div className={styles.subtitle}>
              {isOnline ? "Online" : lastActiveLabel ? `Last active ${lastActiveLabel}` : ""}
            </div>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        {email && (
          <button
            className={styles.actionBtn}
            onClick={handleSendEmail}
            type="button"
          >
            <FaEnvelope /> Email
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
