import MessageItem from "./MessageItem";

const MessageList = ({ messages, onReply, onDelete, onPin }) => {
  return (
    <div className="mt-4 space-y-4 max-h-80 overflow-y-auto p-4 border border-gray-700 rounded-lg">
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
