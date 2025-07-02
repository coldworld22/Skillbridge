export default function ChatGroupHeader({ groupName, groupId }) {
  const title = groupName || groupId;
  return (
    <div className="pb-2 border-b mb-2">
      <h2 className="text-lg font-bold">Group Chat: {title}</h2>
    </div>
  );
}
  