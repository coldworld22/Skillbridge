import { Fragment, useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../next-i18next.config.js";
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
import useAuthStore from "@/store/auth/authStore";
import StudentLayout from "@/components/layouts/StudentLayout";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import AdminLayout from "@/components/layouts/AdminLayout";
import withAuthProtection from "@/hooks/withAuthProtection";

const layoutMap = {
  admin: AdminLayout,
  superadmin: AdminLayout,
  instructor: InstructorLayout,
  student: StudentLayout,
};

const MessagesPage = () => {
  const { t } = useTranslation("common");
  const { t: tDash } = useTranslation("dashboard");
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
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
  const user = useAuthStore((state) => state.user);
  const role = user?.role?.toLowerCase();
  const LayoutComponent = layoutMap[role] || Fragment;

  const fetchUsersList = useCallback(() => {
    const storeMessages = useMessageStore.getState().items;
    return getUsers()
      .then((data) => setUsers(computeUnreadCounts(data, storeMessages)))
      .catch(() => setUsers([]));
  }, []);

  const handleSelectChat = useCallback(
    (chat) => {
      if (!chat) return;
      setSelectedChat(chat);
      if (chat.isGroup) return;

      setUsers((prev) => {
        if (prev.some((u) => u.id === chat.id)) {
          return prev;
        }
        const hydrated = computeUnreadCounts([chat], messages)[0] || chat;
        return [...prev, hydrated];
      });
    },
    [messages]
  );

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
    const term = searchTerm.trim();
    if (!term) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      getUsers(term)
        .then((data) => {
          if (cancelled) return;
          const storeMessages = useMessageStore.getState().items;
          setSearchResults(computeUnreadCounts(data, storeMessages));
        })
        .catch(() => {
          if (!cancelled) setSearchResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  useEffect(() => {
    if (!searchTerm.trim() || !searchResults.length) return;
    setSearchResults((prev) => computeUnreadCounts(prev, messages));
  }, [messages, searchTerm]);

  useEffect(() => {
    const lowerSearch = searchTerm.toLowerCase().trim();
    const baseUsers = lowerSearch ? searchResults : users;

    if (!lowerSearch) {
      setFilteredUsers(baseUsers);
    } else {
      setFilteredUsers(
        baseUsers.filter((user) => {
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
    }

    setFilteredGroups(
      groups.filter((group) => {
        const groupName = group.name?.toLowerCase() || "";
        return lowerSearch ? groupName.includes(lowerSearch) : true;
      })
    );
  }, [searchTerm, users, groups, searchResults]);

  useEffect(() => {
    const { groupId, userId } = router.query;
    if (groupId) {
      const group = groups.find((g) => g.id === Number(groupId));
      if (group) handleSelectChat({ ...group, isGroup: true });
    } else if (userId) {
      const user = users.find((u) => u.id === Number(userId));
      if (user) handleSelectChat(user);
    }
  }, [router.query, groups, users, handleSelectChat]);

  useEffect(() => {
    if (selectedChat && !selectedChat.isGroup) {
      const updated = users.find((u) => u.id === selectedChat.id);
      if (updated && updated !== selectedChat) {
        setSelectedChat(updated);
      }
    }
  }, [users, selectedChat]);


  return (
    <LayoutComponent>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm min-h-[70vh]">
        <div className="max-w-7xl mx-auto space-y-8 p-6">
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <FaSearch className="text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t("search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border-0 bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none"
            />
          </div>

          <div className="space-y-3">
            {messages.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center mb-3">
                  <h3 className="flex-1 text-lg font-semibold text-gray-900">
                    {t("system_messages")}
                  </h3>
                  <button
                    className="text-xs font-medium text-blue-600 hover:text-blue-500"
                    onClick={() => setShowSystemMessages((s) => !s)}
                  >
                    {showSystemMessages ? t("hide") : t("show")}
                  </button>
                </div>
                {showSystemMessages && (
                  <ul className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {messages.map((msg) => (
                      <li
                        key={msg.id}
                        onClick={async () => {
                          if (!msg.read) await markMessageRead(msg.id);
                          const userItem = users.find((u) => u.id === msg.sender_id);
                          handleSelectChat(
                            userItem || {
                              id: msg.sender_id,
                              name: msg.sender_name,
                            }
                          );
                        }}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-transparent p-3 transition hover:border-blue-200 hover:bg-blue-50 ${
                          msg.read ? "text-gray-500" : "text-gray-900"
                        }`}
                      >
                        <span className="flex-1 text-sm">
                          <span className="mr-1 font-semibold text-gray-900">
                            {msg.sender_name || "System"}:
                          </span>
                          <span className="text-gray-700">{msg.message}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          {!msg.read && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">
                              {t("new")}
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMessageStore(msg.id);
                            }}
                            className="text-gray-400 transition hover:text-red-500"
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
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-10 text-center">
                <button
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
                  onClick={() => {
                    setSearchTerm("");
                    searchInputRef.current?.focus();
                  }}
                >
                  {t("start_new_message")}
                </button>
              </div>
            )}
          </div>

          {!selectedChat ? (
            <div className="space-y-6">
              {searchTerm && (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">
                      👤 {t("users")}
                    </h3>
                    {searching && (
                      <p className="text-sm text-gray-500">
                        {t("searching", "Searching...")}
                      </p>
                    )}
                    {!searching && filteredUsers.length > 0 ? (
                      <div className="space-y-2">
                        {filteredUsers.map((userItem) => (
                          <div
                            key={userItem.id}
                            className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition hover:border-blue-200 hover:bg-blue-50"
                          >
                            <div className="flex items-center gap-3">
                              <ChatImage
                                src={getAvatarUrl(
                                  userItem.profileImage ||
                                    userItem.profile_image ||
                                    userItem.avatar_url
                                )}
                                alt={userItem.name || "User"}
                                className="h-10 w-10 rounded-full border border-white shadow"
                                width={40}
                                height={40}
                              />
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {userItem.name || "Unknown User"}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {userItem.email || "No Email"}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {userItem.phone || "No Phone"}
                                </p>
                              </div>
                            </div>
                            <button
                              className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white transition hover:bg-blue-500"
                              onClick={() => handleSelectChat(userItem)}
                            >
                              <FaCommentDots /> {t("start_chat")}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : !searching ? (
                      <p className="text-sm text-gray-500">
                        {t("no_users_found", "No users found.")}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">
                      📌 {t("groups")}
                    </h3>
                    {filteredGroups.length > 0 ? (
                      <div className="space-y-2">
                        {filteredGroups.map((group) => (
                          <div
                            key={group.id}
                            className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition hover:border-blue-200 hover:bg-blue-50"
                          >
                            <div className="flex items-center gap-3">
                              <ChatImage
                                src={getAvatarUrl(
                                  group.cover_image ||
                                    group.image ||
                                    group.avatar_url,
                                  "/images/group-placeholder.jpg"
                                )}
                                alt={group.name}
                                className="h-10 w-10 rounded-full border border-white shadow"
                                width={40}
                                height={40}
                              />
                              <p className="font-semibold text-gray-900">
                                {group.name || "Unnamed Group"}
                              </p>
                            </div>
                            <button
                              className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white transition hover:bg-blue-500"
                              onClick={() =>
                                handleSelectChat({ ...group, isGroup: true })
                              }
                            >
                              <FaCommentDots /> {tDash("groupsPage.join_group")}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No groups found.</p>
                    )}
                  </div>
                </div>
              )}

              {!searchTerm && (
                <ChatNotifications
                  users={users}
                  groups={groups}
                  setSelectedChat={handleSelectChat}
                />
              )}
            </div>
          ) : (
            <main className="grid grid-cols-1 gap-6 lg:grid-cols-4">
              <ChatSidebar
                users={users}
                groups={groups}
                setSelectedChat={handleSelectChat}
                selectedChat={selectedChat}
              />
              <div className="lg:col-span-3">
                {selectedChat.isGroup ? (
                  <GroupChat group={selectedChat} />
                ) : (
                  <ChatWindow
                    selectedChat={selectedChat}
                    refreshUsers={fetchUsersList}
                  />
                )}
              </div>
            </main>
          )}
        </div>
      </div>
    </LayoutComponent>
  );
};

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "dashboard"], nextI18NextConfig)),
    },
  };
}

export default withAuthProtection(MessagesPage, ["student", "instructor", "admin", "superadmin"]);
