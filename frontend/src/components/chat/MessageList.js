import MessageItem from "./MessageItem";
import styles from "./MessageList.module.scss";

const MessageList = ({ messages, onReply, onDelete, onPin }) => {
  return (
    <div className={styles.list}>
      {messages.map((msg, index) => (
        <MessageItem
          key={index}
          message={msg}
          onReply={() => onReply?.(msg)}
          onDelete={() => onDelete?.(msg.id)}
          onPin={() => onPin?.(msg.id)}
        />
      ))}
    </div>
  );
};

export default MessageList;
