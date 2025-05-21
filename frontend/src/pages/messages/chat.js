import { useState, useEffect } from "react";
import Navbar from "@/components/website/sections/Navbar";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow"; 
import { getUsers, getGroups } from "@/services/messageService";

const ChatPage = () => {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    getUsers().then(setUsers).catch(() => setUsers([]));
    getGroups().then(setGroups).catch(() => setGroups([]));
  }, []);

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <main className="container mx-auto p-6 grid grid-cols-1 md:grid-cols-4 gap-6 relative top-20">
        <ChatSidebar users={users} groups={groups} setSelectedChat={setSelectedChat} selectedChat={selectedChat} />
        {selectedChat ? <ChatWindow selectedChat={selectedChat} /> : <div className="col-span-3 text-center text-gray-400">Select a chat to start messaging</div>}
      </main>
    </div>
  );
};

export default ChatPage;
