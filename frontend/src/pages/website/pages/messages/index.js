import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/website/sections/Navbar";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatNotifications from "@/components/chat/ChatNotifications"; // ✅ Import Chat Notifications
import { getUsers, getGroups } from "@/services/messageService";
import { FaSearch, FaCommentDots } from "react-icons/fa";

const MessagesPage = () => {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);

  const router = useRouter();

  // ✅ Fetch users & groups from the platform
  useEffect(() => {
    getUsers().then(setUsers).catch(() => setUsers([]));
    getGroups().then(setGroups).catch(() => setGroups([]));
  }, []);

  // ✅ Filter users & groups based on search term
  useEffect(() => {
    const lowerSearch = searchTerm.toLowerCase().trim(); // ✅ Ensure `searchTerm` is a string & trim spaces

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

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      {/* ✅ Navbar */}
      <Navbar />

      {/* ✅ Main Content Wrapper */}
      <div className="container mx-auto px-6 py-8 mt-16">
        {/* ✅ Search Bar */}
        <div className="flex items-center bg-gray-700 p-3 rounded-lg mb-6">
          <FaSearch className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search users, groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 bg-gray-600 text-white rounded-md focus:outline-none"
          />
        </div>

        {/* ✅ If no chat is selected, show search & notifications */}
        {!selectedChat ? (
          <div>
            {/* 📨 New Message Feature */}
            {searchTerm && (
              <div className="space-y-6">
                {/* 👤 Users Section */}
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
                              src={user.profileImage || "/default-avatar.png"} 
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

                {/* 📌 Groups Section */}
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

            {/* 🛎️ Notifications (If No Search Term) */}
            {!searchTerm && <ChatNotifications users={users} groups={groups} setSelectedChat={setSelectedChat} />}
          </div>
        ) : (
          <main className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <ChatSidebar users={users} groups={groups} setSelectedChat={setSelectedChat} selectedChat={selectedChat} />
            <ChatWindow selectedChat={selectedChat} />
          </main>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
