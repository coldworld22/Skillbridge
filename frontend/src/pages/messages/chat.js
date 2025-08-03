import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/website/sections/Navbar";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import CallOverlay from "@/components/video-call/CallOverlay";
import socket from "@/services/socketService";
import { getUsers, getGroups } from "@/services/messageService";

const ChatPage = () => {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  const router = useRouter();

  useEffect(() => {
    getUsers().then(setUsers).catch(() => setUsers([]));
    getGroups().then(setGroups).catch(() => setGroups([]));
  }, []);

  useEffect(() => {
    const handleIncomingCall = (data) => setIncomingCall(data);
    socket.on("incoming-call", handleIncomingCall);
    return () => socket.off("incoming-call", handleIncomingCall);
  }, []);

  const handleAccept = () => {
    if (!incomingCall) return;
    socket.emit("call-accepted", {
      chatId: incomingCall.chatId,
      roomId: incomingCall.roomId,
    });
    router.push(`/video-call?roomId=${incomingCall.roomId}`);
    setIncomingCall(null);
  };

  const handleDecline = () => {
    if (!incomingCall) return;
    socket.emit("call-declined", { chatId: incomingCall.chatId });
    setIncomingCall(null);
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <main className="container mx-auto p-6 grid grid-cols-1 md:grid-cols-4 gap-6 relative top-20">
        <ChatSidebar users={users} groups={groups} setSelectedChat={setSelectedChat} selectedChat={selectedChat} />
        {selectedChat ? <ChatWindow selectedChat={selectedChat} /> : <div className="col-span-3 text-center text-gray-400">Select a chat to start messaging</div>}
      </main>
      {incomingCall && (
        <CallOverlay
          incoming
          name={incomingCall.name}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      )}
    </div>
  );
};

export default ChatPage;

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
