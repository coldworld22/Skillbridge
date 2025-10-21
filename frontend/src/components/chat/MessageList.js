import MessageItem from "./MessageItem";

const MessageList = ({ messages, onReply, onDelete, onPin }) => {
  return (
    <div className="mt-2 max-h-80 space-y-4 overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
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
