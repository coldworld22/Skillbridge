import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../next-i18next.config.js";
import Navbar from "@/components/website/sections/Navbar";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import GroupChat from "@/components/chat/GroupChat";
import ChatNotifications from "@/components/chat/ChatNotifications";
import { getUsers, getGroups } from "@/services/messageService";
import { FaSearch, FaCommentDots, FaTrash } from "react-icons/fa";
import ChatImage from "@/components/shared/ChatImage";
import useMessageStore from "@/store/messages/messageStore";
import { API_BASE_URL } from "@/config/config";
import { computeUnreadCounts } from "@/utils/messages/computeUnreadCounts";

const MessagesPage = () => {
  const { t } = useTranslation("common");
  const { t: tDash } = useTranslation("dashboard");
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const searchInputRef = useRef(null);
  const [showSystemMessages, setShowSystemMessages] = useState(true);

  const messages = useMessageStore((state) => state.items);
  const fetchMessagesStore = useMessageStore((state) => state.fetch);
  const startPollingStore = useMessageStore((state) => state.startPolling);
  const stopPollingStore = useMessageStore((state) => state.stopPolling);
  const markMessageRead = useMessageStore((state) => state.markRead);
  const deleteMessageStore = useMessageStore((state) => state.delete);

  const getAvatarUrl = (url, fallback = "/images/default-avatar.png") => {
    if (!url) return fallback;
    if (url.startsWith("http") || url.startsWith("blob:")) return url;
    return `${API_BASE_URL}${url}`;
  };

  const router = useRouter();

  const fetchUsersList = useCallback(() => {
    const storeMessages = useMessageStore.getState().items;
    return getUsers()
      .then((data) => setUsers(computeUnreadCounts(data, storeMessages)))
      .catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    fetchUsersList();
    getGroups().then(setGroups).catch(() => setGroups([]));
    fetchMessagesStore();
    startPollingStore();

    const interval = setInterval(fetchUsersList, 30000);
    return () => {
      clearInterval(interval);
      stopPollingStore();
    };
  }, [fetchUsersList, fetchMessagesStore, startPollingStore, stopPollingStore]);

  useEffect(() => {
    setUsers((prev) => computeUnreadCounts(prev, messages));
  }, [messages]);

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
      if (group) setSelectedChat({ ...group, isGroup: true });
    } else if (userId) {
      const user = users.find((u) => u.id === Number(userId));
      if (user) setSelectedChat(user);
    }
  }, [router.query, groups, users]);

  useEffect(() => {
    if (selectedChat && !selectedChat.isGroup) {
      const updated = users.find((u) => u.id === selectedChat.id);
      if (updated && updated !== selectedChat) {
        setSelectedChat(updated);
      }
    }
  }, [users, selectedChat]);


  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-8 mt-16">
        <div className="flex items-center bg-gray-700 p-3 rounded-lg mb-6">
          <FaSearch className="text-gray-400 mr-2" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t('search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 bg-gray-600 text-white rounded-md focus:outline-none"
          />
        </div>

        <div className="mb-8 space-y-3">
          {messages.length > 0 && (
            <div>
              <div className="flex items-center mb-2">
                <h3 className="text-lg text-yellow-400 flex-1">{t('system_messages')}</h3>
                <button
                  className="text-xs text-blue-400 hover:underline"
                  onClick={() => setShowSystemMessages((s) => !s)}
                >
                  {showSystemMessages ? t('hide') : t('show')}
                </button>
              </div>
              {showSystemMessages && (
                <ul className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {messages.map((msg) => (
                    <li
                      key={msg.id}
                      onClick={async () => {
                        if (!msg.read) await markMessageRead(msg.id);
                        const user = users.find((u) => u.id === msg.sender_id);
                        setSelectedChat(
                          user || { id: msg.sender_id, name: msg.sender_name }
                        );
                      }}
                      className={`p-3 rounded-md cursor-pointer bg-gray-700 hover:bg-gray-600 transition flex justify-between items-center ${msg.read ? "opacity-70" : ""}`}
                    >
                      <span className="flex-1">
                        <span className="font-semibold mr-1">
                          {msg.sender_name || "System"}:
                        </span>
                        {msg.message}
                      </span>
                      <div className="flex items-center gap-2 ml-2">
                        {!msg.read && (
                          <span className="text-xs text-red-400">{t('new')}</span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMessageStore(msg.id);
                          }}
                          className="text-red-400 hover:text-red-300"
                          title="Delete"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
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
                {t('start_new_message')}
              </button>
            </div>
          )}
        </div>

        {!selectedChat ? (
          <div>
            {searchTerm && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg text-yellow-400">👤 {t('users')}</h3>
                  {filteredUsers.length > 0 ? (
                    <div className="space-y-2">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between gap-3 p-3 hover:bg-gray-700 rounded-lg cursor-pointer transition"
                        >
                          <div className="flex items-center gap-3">
                            <ChatImage
                              src={getAvatarUrl(user.profileImage)}
                              alt={user.name || "User"}
                              className="w-10 h-10 rounded-full border border-yellow-500"
                              width={40}
                              height={40}
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
                            <FaCommentDots /> {t('start_chat')}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No users found.</p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg text-yellow-400">📌 {t('groups')}</h3>
                  {filteredGroups.length > 0 ? (
                    <div className="space-y-2">
                      {filteredGroups.map((group) => (
                        <div
                          key={group.id}
                          className="flex items-center justify-between gap-3 p-3 hover:bg-gray-700 rounded-lg cursor-pointer transition"
                        >
                          <div className="flex items-center gap-3">
                            <ChatImage
                              src={
                                getAvatarUrl(
                                  group.cover_image || group.image,
                                  "/images/group-placeholder.jpg"
                                )
                              }
                              alt={group.name}
                              className="w-10 h-10 rounded-full border border-gray-500"
                              width={40}
                              height={40}
                            />
                            <p className="text-white font-semibold">{group.name || "Unnamed Group"}</p>
                          </div>
                          <button
                            className="flex items-center gap-2 bg-yellow-500 text-gray-900 px-3 py-1 rounded-md hover:bg-yellow-600 transition"
                            onClick={() => setSelectedChat({ ...group, isGroup: true })}
                          >
                            <FaCommentDots /> {tDash('groupsPage.join_group')}
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
            {selectedChat.isGroup ? (
              <GroupChat group={selectedChat} />
            ) : (
              <ChatWindow selectedChat={selectedChat} refreshUsers={fetchUsersList} />
            )}
          </main>
        )}
      </div>
    </div>
  );
};

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"], nextI18NextConfig)),
    },
  };
}

export default MessagesPage;
