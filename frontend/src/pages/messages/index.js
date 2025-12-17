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
import styles from "./messages.layout.module.scss";

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
      <div className={styles.shell}>
        <div className={styles.panel}>
          <div className={styles.panelInner}>
            <div className={styles.searchBox}>
              <FaSearch className={styles.muted} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t("search_placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.list}>
              {messages.length > 0 && (
                <div className={styles.card}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "0.75rem", gap: "0.5rem" }}>
                    <h3 className={styles.heading}>
                      {t("system_messages")}
                    </h3>
                    <button
                      className={styles.badge}
                      onClick={() => setShowSystemMessages((s) => !s)}
                    >
                      {showSystemMessages ? t("hide") : t("show")}
                    </button>
                  </div>
                  {showSystemMessages && (
                    <ul className={styles.list} style={{ maxHeight: "11rem", overflowY: "auto" }}>
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
                          className={styles.card}
                          style={{ cursor: "pointer" }}
                        >
                          <span style={{ flex: 1, fontSize: "0.9rem" }}>
                            <span className={styles.heading}>
                              {msg.sender_name || "System"}:
                            </span>
                            <span className={styles.muted}> {msg.message}</span>
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            {!msg.read && (
                              <span className={styles.badge}>
                                {t("new")}
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMessageStore(msg.id);
                              }}
                              className={styles.muted}
                              title="Delete"
                            >
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {messages.length === 0 && !selectedChat && (
                <div className={styles.card} style={{ textAlign: "center", borderStyle: "dashed" }}>
                  <button
                    className={`${styles.button} ${styles.buttonSecondary}`}
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
              <div className={styles.list}>
                {searchTerm && (
                  <div className={styles.grid}>
                    <div className={styles.card}>
                      <h3 className={styles.heading}>
                        👤 {t("users")}
                      </h3>
                      {searching && (
                        <p className={styles.muted}>
                          {t("searching", "Searching...")}
                        </p>
                      )}
                      {!searching && filteredUsers.length > 0 ? (
                        <div className={styles.list}>
                          {filteredUsers.map((userItem) => (
                            <div
                              key={userItem.id}
                              className={styles.card}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <ChatImage
                                  src={getAvatarUrl(
                                    userItem.profileImage ||
                                      userItem.profile_image ||
                                      userItem.avatar_url
                                  )}
                                  alt={userItem.name || "User"}
                                style={{ width: "2.5rem", height: "2.5rem", borderRadius: "999px", border: "1px solid #e5e7eb", objectFit: "cover" }}
                                width={40}
                                height={40}
                                />
                                <div>
                                  <p className={styles.heading}>
                                    {userItem.name || "Unknown User"}
                                  </p>
                                  <p className={styles.muted}>
                                    {userItem.email || "No Email"}
                                  </p>
                                  <p className={styles.muted}>
                                    {userItem.phone || "No Phone"}
                                  </p>
                                </div>
                              </div>
                              <button
                                className={`${styles.button} ${styles.buttonSecondary}`}
                                onClick={() => handleSelectChat(userItem)}
                              >
                                <FaCommentDots /> {t("start_chat")}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : !searching ? (
                        <p className={styles.muted}>
                          {t("no_users_found", "No users found.")}
                        </p>
                      ) : null}
                    </div>

                    <div className={styles.card}>
                      <h3 className={styles.heading}>
                        📌 {t("groups")}
                      </h3>
                      {filteredGroups.length > 0 ? (
                        <div className={styles.list}>
                          {filteredGroups.map((group) => (
                            <div
                              key={group.id}
                              className={styles.card}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <ChatImage
                                  src={getAvatarUrl(
                                    group.cover_image ||
                                      group.image ||
                                      group.avatar_url,
                                    "/images/group-placeholder.jpg"
                                  )}
                                  alt={group.name}
                                style={{ width: "2.5rem", height: "2.5rem", borderRadius: "999px", border: "1px solid #e5e7eb", objectFit: "cover" }}
                                width={40}
                                height={40}
                                />
                                <p className={styles.heading}>
                                  {group.name || "Unnamed Group"}
                                </p>
                              </div>
                              <button
                                className={`${styles.button} ${styles.buttonSecondary}`}
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
                        <p className={styles.muted}>No groups found.</p>
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
              <main className={styles.conversationGrid}>
                <ChatSidebar
                  users={users}
                  groups={groups}
                  setSelectedChat={handleSelectChat}
                  selectedChat={selectedChat}
                />
                <div>
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
      </div>
    </LayoutComponent>
  );
};

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "dashboard"], nextI18NextConfig)),
    },
  };
}

export default withAuthProtection(MessagesPage, ["student", "instructor", "admin", "superadmin"]);
