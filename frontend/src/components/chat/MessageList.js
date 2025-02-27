import MessageItem from "./MessageItem";

const MessageList = ({ messages }) => {
  return (
    <div className="mt-4 space-y-4 max-h-80 overflow-y-auto p-4 border border-gray-700 rounded-lg">
      {messages.map((msg, index) => (
        <MessageItem key={index} message={msg} />
      ))}
    </div>
  );
};

export default MessageList;
