import { useState, useEffect } from "react";
import Navbar from "@/components/website/sections/Navbar";
import { getGroups, sendGroupMessage } from "@/services/groupService";
import { motion } from "framer-motion";
import ChatImage from "@/components/shared/ChatImage";
import formatRelativeTime from "@/utils/relativeTime";
import EmojiPicker from "emoji-picker-react";
import MessageInput from "./MessageInput";



import {
  FaUsers, FaPaperPlane, FaPlus, FaFileUpload, FaSmile, FaUserCircle
} from "react-icons/fa";

const GroupChatPage = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const [file, setFile] = useState(null);
  const [emojiPicker, setEmojiPicker] = useState(false);

  useEffect(() => {
    getGroups().then((data) => setGroups(data));
  }, []);

  const handleSendMessage = () => {
    if (!selectedGroup || newMessage.trim() === "") return;

    const newChat = {
      id: selectedGroup.messages.length + 1,
      sender: "You",
      text: newMessage,
      timestamp: new Date().toISOString(),
      file
    };

    setGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === selectedGroup.id
          ? { ...group, messages: [...group.messages, newChat] }
          : group
      )
    );
    setNewMessage("");
    setFile(null);
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <main className="container mx-auto p-6 pt-24">
        <h1 className="text-3xl font-bold text-yellow-500">👥 Group Chat</h1>

        {/* Create Group */}
        <div className="mb-4 flex">
          <input
            type="text"
            placeholder="Enter group name..."
            className="w-full p-2 bg-gray-700 text-white rounded-l-lg focus:outline-none"
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="px-4 py-2 bg-blue-500 text-white font-bold rounded-r-lg"
            onClick={() => alert("New group created! (Will connect to API later)")}
          >
            <FaPlus /> Create
          </motion.button>
        </div>

        {/* Group List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold flex items-center">
              <FaUsers className="mr-2 text-yellow-500" /> Available Groups
            </h3>
            <ul className="mt-2 space-y-3">
              {groups.map((group) => (
                <li
                  key={group.id}
                  className={`p-3 rounded-lg cursor-pointer transition ${
                    selectedGroup?.id === group.id ? "bg-yellow-500 text-gray-900" : "bg-gray-700"
                  }`}
                  onClick={() => setSelectedGroup(group)}
                >
                  {group.groupName}
                </li>
              ))}
            </ul>
          </div>

          {/* Chat Window */}
          {selectedGroup && (
            <motion.div className="bg-gray-800 p-4 rounded-lg shadow-lg col-span-2">
              <h3 className="text-lg font-bold text-yellow-500">{selectedGroup.groupName}</h3>
              <p className="text-sm text-gray-400">Participants: {selectedGroup.participants.join(", ")}</p>

              {/* Messages */}
              <div className="mt-4 space-y-4 max-h-80 overflow-y-auto p-4 border border-gray-700 rounded-lg">
                {selectedGroup.messages.map((msg, index) => (
                  <motion.div key={index} className={`p-3 rounded-lg flex items-center gap-3 ${
                      msg.sender === "You" ? "bg-yellow-500 text-gray-900 ml-auto" : "bg-gray-700"
                    }`}
                  >
                    <FaUserCircle className="text-white text-3xl" />
                    <div>
                      <strong>{msg.sender}</strong>
                      <p>{msg.text}</p>
                      {msg.file && (
                        <ChatImage
                          src={msg.file}
                          alt="Attachment"
                          className="w-16 h-16 mt-2 rounded-lg"
                          width={64}
                          height={64}
                        />
                      )}
                      <p className="text-xs text-gray-400">{formatRelativeTime(msg.timestamp)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Input with Emoji Picker */}
              <MessageInput onSendMessage={handleSendMessage} />
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default GroupChatPage;
