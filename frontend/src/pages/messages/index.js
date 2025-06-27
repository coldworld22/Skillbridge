import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/website/sections/Navbar";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatNotifications from "@/components/chat/ChatNotifications";
import { getUsers, getGroups } from "@/services/messageService";
import { FaSearch, FaCommentDots } from "react-icons/fa";
import useMessageStore from "@/store/messages/messageStore";

const MessagesPage = () => {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const searchInputRef = useRef(null);

  const messages = useMessageStore((state) => state.items);
  const fetchMessages = useMessageStore((state) => state.fetch);
  const startPolling = useMessageStore((state) => state.startPolling);
  const markMessageRead = useMessageStore((state) => state.markRead);

  const router = useRouter();

  const fetchUsersList = useCallback(
    () => getUsers().then(setUsers).catch(() => setUsers([])),
    []
  );

  useEffect(() => {
    fetchUsersList();
    getGroups().then(setGroups).catch(() => setGroups([]));
    fetchMessages();
    startPolling();

    const interval = setInterval(fetchUsersList, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const lowerSearch = searchTerm.toLowerCase().trim();

    setFilteredUsers(
      users.filter((user) => {
        const userName = user.name?.toLowerCase() || "";
        const userEmail = user.email?.toLowerCase() || "";
        const userPhone = user.phone?.toLowerCase() || "";

        return (
          userName.includes(lowerSearch) ||
          userEmail.includes(lowerSearch) ||
          userPhone.includes(lowerSearch)
        );
      })
    );

    setFilteredGroups(
      groups.filter((group) => {
        const groupName = group.name?.toLowerCase() || "";
        return groupName.includes(lowerSearch);
      })
    );
  }, [searchTerm, users, groups]);

  useEffect(() => {
    const { groupId, userId } = router.query;
    if (groupId) {
      const group = groups.find((g) => g.id === Number(groupId));
      if (group) setSelectedChat(group);
    } else if (userId) {
      const user = users.find((u) => u.id === Number(userId));
      if (user) setSelectedChat(user);
    }
  }, [router.query, groups, users]);

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-8 mt-16">
        <div className="flex items-center bg-gray-700 p-3 rounded-lg mb-6">
          <FaSearch className="text-gray-400 mr-2" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search users, groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 bg-gray-600 text-white rounded-md focus:outline-none"
          />
        </div>

        <div className="mb-8 space-y-3">
          {messages.length > 0 && (
            <div>
              <h3 className="text-lg text-yellow-400 mb-2">System Messages</h3>
              <ul className="space-y-2">
                {messages.map((msg) => (
                  <li
                    key={msg.id}
                    onClick={() => !msg.read && markMessageRead(msg.id)}
                    className={`p-3 rounded-md cursor-pointer bg-gray-700 hover:bg-gray-600 transition flex justify-between ${msg.read ? "opacity-70" : ""}`}
                  >
                    <span>{msg.message}</span>
                    {!msg.read && (
                      <span className="text-xs text-red-400 ml-2">new</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {messages.length === 0 && !selectedChat && (
            <div className="text-center">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                onClick={() => {
                  setSearchTerm("");
                  searchInputRef.current?.focus();
                }}
              >
                Start New Message
              </button>
            </div>
          )}
        </div>

        {!selectedChat ? (
          <div>
            {searchTerm && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg text-yellow-400">👤 Users</h3>
                  {filteredUsers.length > 0 ? (
                    <div className="space-y-2">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between gap-3 p-3 hover:bg-gray-700 rounded-lg cursor-pointer transition"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={user.profileImage || "/images/default-avatar.png"}
                              alt={user.name || "User"}
                              className="w-10 h-10 rounded-full border border-yellow-500"
                            />
                            <div>
                              <p className="text-white font-semibold">{user.name || "Unknown User"}</p>
                              <p className="text-gray-400 text-sm">{user.email || "No Email"}</p>
                              <p className="text-gray-400 text-sm">{user.phone || "No Phone"}</p>
                            </div>
                          </div>
                          <button
                            className="flex items-center gap-2 bg-yellow-500 text-gray-900 px-3 py-1 rounded-md hover:bg-yellow-600 transition"
                            onClick={() => setSelectedChat(user)}
                          >
                            <FaCommentDots /> Start Chat
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No users found.</p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg text-yellow-400">📌 Groups</h3>
                  {filteredGroups.length > 0 ? (
                    <div className="space-y-2">
                      {filteredGroups.map((group) => (
                        <div
                          key={group.id}
                          className="flex items-center justify-between gap-3 p-3 hover:bg-gray-700 rounded-lg cursor-pointer transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-500 text-black flex items-center justify-center rounded-full font-bold">
                              {group.name ? group.name.charAt(0).toUpperCase() : "?"}
                            </div>
                            <p className="text-white font-semibold">{group.name || "Unnamed Group"}</p>
                          </div>
                          <button
                            className="flex items-center gap-2 bg-yellow-500 text-gray-900 px-3 py-1 rounded-md hover:bg-yellow-600 transition"
                            onClick={() => setSelectedChat(group)}
                          >
                            <FaCommentDots /> Join Group
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No groups found.</p>
                  )}
                </div>
              </div>
            )}

            {!searchTerm && (
              <ChatNotifications
                users={users}
                groups={groups}
                setSelectedChat={setSelectedChat}
              />
            )}
          </div>
        ) : (
          <main className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <ChatSidebar
              users={users}
              groups={groups}
              setSelectedChat={setSelectedChat}
              selectedChat={selectedChat}
            />
            <ChatWindow selectedChat={selectedChat} refreshUsers={fetchUsersList} />
          </main>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;