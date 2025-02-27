import { FaEnvelopeOpenText, FaUsers } from "react-icons/fa";

const ChatNotifications = ({ users, groups, setSelectedChat }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold text-yellow-500">📩 Unread Messages</h3>

      {/* ✅ User Notifications */}
      {users.length > 0 && (
        <>
          <h4 className="text-yellow-400 font-semibold mt-4">Users</h4>
          <ul className="space-y-2">
            {users.map(user => (
              <li 
                key={user.id} 
                className="p-3 bg-gray-700 rounded-lg cursor-pointer flex items-center gap-3 hover:bg-gray-600 transition"
                onClick={() => setSelectedChat(user)}
              >
                <FaEnvelopeOpenText className="text-yellow-500" />
                {user.name}
                {user.unread > 0 && (
                  <span className="ml-auto bg-red-500 text-xs px-2 py-1 rounded-full">
                    {user.unread} new
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* ✅ Group Notifications */}
      {groups.length > 0 && (
        <>
          <h4 className="text-yellow-400 font-semibold mt-4">Groups</h4>
          <ul className="space-y-2">
            {groups.map(group => (
              <li 
                key={group.id} 
                className="p-3 bg-gray-700 rounded-lg cursor-pointer flex items-center gap-3 hover:bg-gray-600 transition"
                onClick={() => setSelectedChat(group)}
              >
                <FaUsers className="text-yellow-500" />
                {group.groupName}
                {group.unread > 0 && (
                  <span className="ml-auto bg-red-500 text-xs px-2 py-1 rounded-full">
                    {group.unread} new
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* ✅ No Notifications */}
      {users.length === 0 && groups.length === 0 && (
        <p className="text-gray-400 mt-4">No new messages.</p>
      )}
    </div>
  );
};

export default ChatNotifications;
