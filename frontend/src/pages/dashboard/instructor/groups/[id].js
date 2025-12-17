import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import toast from "react-hot-toast";
import Link from "next/link";
import GroupChat from "@/components/chat/GroupChat";
import GroupMembersList from "@/components/groups/GroupMembersList";
import GroupPermissionSettings from "@/components/groups/GroupPermissionSettings";
import groupService from "@/services/groupService";
import JoinRequestCard from "@/components/groups/JoinRequestCard";
import useAuthStore from "@/store/auth/authStore";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

export default function GroupDetailsPage() {
  const router = useRouter();
  const { t } = useTranslation("dashboard");
  const { id: groupId } = router.query;

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinStatus, setJoinStatus] = useState("none");
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const { user, hasHydrated } = useAuthStore();

  const [members, setMembers] = useState([]);
  const [membersFetched, setMembersFetched] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const previousPendingCount = useRef(0);

  useEffect(() => {
    if (router.pathname !== "/dashboard/instructor/groups/[id]") return;
    if (!router.isReady || !groupId) return;

    let isMounted = true;
    setLoading(true);
    setMembersFetched(false);

    const load = async () => {
      try {
        const [groupResult, membersResult] = await Promise.allSettled([
          groupService.getGroupById(groupId),
          groupService.getGroupMembers(groupId),
        ]);

        const groupData =
          groupResult.status === "fulfilled" ? groupResult.value : null;

        if (!groupData) {
          if (isMounted) {
            toast.error(t("groupsDetailPage.groupNotFound"));
            router.push("/dashboard/instructor/groups/explore");
          }
          return;
        }

        if (!isMounted) return;

        setGroup(groupData);

        if (membersResult.status === "fulfilled") {
          setMembers(membersResult.value);
        } else {
          setMembers([]);
        }
        setMembersFetched(true);
      } catch (err) {
        if (!isMounted) return;
        toast.error(t("groupsDetailPage.loadError"));
        router.push("/dashboard/instructor/groups/explore");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [router.isReady, groupId, router.pathname, t]);

  useEffect(() => {
    if (!hasHydrated || !group) return;
    if (!user) {
      setJoinStatus("none");
      setIsAdmin(false);
      setCurrentUserRole(null);
      return;
    }
    if (!membersFetched) return;

    let role = null;
    if (String(user.id) === String(group.creator_id)) {
      setIsAdmin(true);
      setJoinStatus("joined");
      role = "admin";
    } else {
      const member = members.find((m) => String(m.id) === String(user.id));
      if (member) {
        setJoinStatus("joined");
        role = member.role;
        setIsAdmin(member.role === "admin");
      } else {
        setJoinStatus("none");
        setIsAdmin(false);
      }
    }
    setCurrentUserRole(role);
  }, [group, members, user, hasHydrated, membersFetched]);

  useEffect(() => {
    if (!groupId || !isAdmin) return;
    let active = true;

    const fetchRequests = async () => {
      try {
        const list = await groupService.getJoinRequestsForGroup(groupId);
        if (!active) return;
        setPendingCount(Array.isArray(list) ? list.length : 0);
      } catch {
        if (!active) return;
        setPendingCount(0);
      }
    };

    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [groupId, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const prev = previousPendingCount.current;
    if (pendingCount > prev && pendingCount > 0) {
      toast(t("groupsDetailPage.pendingRequestsAlert", { count: pendingCount }));
    }
    previousPendingCount.current = pendingCount;
  }, [pendingCount, isAdmin, t]);

  const handleJoin = async () => {
    try {
      const result = await groupService.joinGroup(groupId);
      const isPending = result?.data?.status === "pending";
      if (isPending) {
        setJoinStatus("pending");
      } else {
        setJoinStatus("joined");
        const role = result?.data?.role || "member";
        setCurrentUserRole(role);
        if (role === "admin") setIsAdmin(true);
        try {
          const refreshedMembers = await groupService.getGroupMembers(groupId);
          setMembers(refreshedMembers);
          setMembersFetched(true);
        } catch {
          // ignore refresh failure
        }
      }
      const message =
        result?.message ||
        (isPending
          ? t("groupsDetailPage.joinRequestSubmitted")
          : t("groupsDetailPage.joinSuccess"));
      toast.success(message);
    } catch (err) {
      setJoinStatus("none");
      toast.error(
        err?.response?.data?.message || t("groupsDetailPage.joinError")
      );
    }
  };

  const handleSaveName = async () => {
    try {
      const updated = await groupService.updateGroup(group.id, {
        name: newName,
      });
      setGroup(updated);
      toast.success(t("groupsDetailPage.updateNameSuccess"));
      setEditingName(false);
    } catch (err) {
      toast.error(t("groupsDetailPage.updateNameError"));
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm(t("groupsDetailPage.confirmDelete", { name: group.name })))
      return;
    try {
      await groupService.deleteGroup(group.id);
      toast.success(t("groupsDetailPage.deleteSuccess"));
      router.push("/dashboard/instructor/groups/my-groups");
    } catch (err) {
      toast.error(t("groupsDetailPage.deleteError"));
    }
  };

  if (loading || !group) {
    return (
      <InstructorLayout>
        <div className="p-6 text-center text-gray-500">
          {t("groupsDetailPage.loading")}
        </div>
      </InstructorLayout>
    );
  }

  const tabs = ["overview"];
  if (joinStatus === "joined") {
    tabs.push("chat");
    tabs.push("members");
    if (isAdmin) tabs.push("member-management");
  }

  const tabLabels = {
    overview: t("groupsDetailPage.tabs.overview"),
    chat: t("groupsDetailPage.tabs.chat"),
    members: t("groupsDetailPage.tabs.members"),
    "member-management": t("groupsDetailPage.tabs.memberManagement"),
  };

  return (
    <InstructorLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Link href="/dashboard/instructor/groups/my-groups">
          <button className="text-sm text-blue-600 hover:underline">
            &larr; {t("groupsPage.back_to_my_groups")}
          </button>
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{group.name}</h1>
            {pendingCount > 0 && (
              <div className="bg-red-100 text-red-800 px-3 py-1 rounded mt-2">
                {t("groupsDetailPage.pendingRequestsLabel", {
                  count: pendingCount,
                })}
              </div>
            )}
            {["admin", "moderator"].includes(currentUserRole) &&
              !editingName && (
                <button
                  onClick={() => {
                    setEditingName(true);
                    setNewName(group.name);
                  }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {t("groupsDetailPage.editName")}
                </button>
              )}
            {editingName && (
              <div className="mt-2 flex gap-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="border p-1 rounded text-sm"
                />
                <button
                  onClick={handleSaveName}
                  className="bg-blue-600 text-white px-2 rounded text-sm"
                >
                  {t("groupsDetailPage.save")}
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="text-sm text-gray-600"
                >
                  {t("groupsDetailPage.cancel")}
                </button>
              </div>
            )}
            {(group.creator || group.creator_id) && (
              <p className="text-sm text-gray-500">
                👑 {t("groupsDetailPage.creator")}:{" "}
                <span>{group.creator || group.creator_id}</span>
              </p>
            )}
          </div>
          <div className="text-right space-y-1">
            <span className="text-sm text-gray-500 block">
              {t("groupsDetailPage.createdAt", {
                date: new Date(group.created_at).toLocaleDateString(
                  router.locale || undefined,
                ),
              })}
            </span>
            {isAdmin && (
              <button
                onClick={handleDeleteGroup}
                className="text-sm text-red-600 hover:underline"
              >
                {t("groupsDetailPage.deleteGroup")}
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-4 border-b pb-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-1 text-sm font-medium ${
                activeTab === tab
                  ? "border-b-2 border-yellow-500 text-yellow-600"
                  : "text-gray-500"
              }`}
            >
              {tab === "member-management" ? (
                <>
                  {tabLabels[tab] || tab}
                  {pendingCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-red-600 text-white">
                      {pendingCount}
                    </span>
                  )}
                </>
              ) : (
                tabLabels[tab] || tab
              )}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-4">
            <img
              src={group.cover_image || group.image || '/images/group-placeholder.jpg'}
              onError={(e) => {
                e.target.src = '/images/group-placeholder.jpg';
              }}
              alt={group.name}
              className="w-full h-48 object-cover rounded-xl"
            />
            <p className="text-gray-700">{group.description}</p>
            {Array.isArray(group.tags) && group.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {group.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {joinStatus === "none" && (
              <button
                onClick={handleJoin}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg"
              >
                {t("groupsPage.join_group")}
              </button>
            )}
            {joinStatus === "pending" && (
              <div className="text-yellow-700 font-semibold">
                {t("groupsPage.join_pending")}
              </div>
            )}
            {joinStatus === "joined" && (
              <div className="text-green-600 font-semibold">
                {t("groupsPage.joined")}
              </div>
            )}
            <div className="pt-4">
              <h2 className="text-sm font-medium mb-1">
                {t("groupsDetailPage.membersHeading", {
                  count: members.length,
                })}
              </h2>
              <div className="flex flex-col gap-2 mt-1">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 text-sm">
                    <img
                      src={m.avatar}
                      className="w-8 h-8 rounded-full border"
                      alt={m.name}
                    />
                    <span>{m.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "chat" && joinStatus === "joined" && (
          <>
            <GroupChat groupId={group.id} groupName={group.name} />
            <div className="mt-6">
              <h2 className="text-sm font-medium mb-1">
                {t("groupsDetailPage.membersHeading", {
                  count: members.length,
                })}
              </h2>
              <div className="flex flex-col gap-2 mt-1">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 text-sm">
                    <img
                      src={m.avatar}
                      className="w-8 h-8 rounded-full border"
                      alt={m.name}
                    />
                    <span>{m.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "members" && joinStatus === "joined" && (
          <div className="space-y-4">
            <GroupMembersList
              groupId={group.id}
              currentUserId={user?.id}
              currentUserRole={currentUserRole}
            />
          </div>
        )}

        {activeTab === "member-management" && isAdmin && (
          <div className="space-y-4">
            <div className="pt-4">
              <h2 className="text-sm font-medium mb-1">
                {t("groupsDetailPage.pendingRequestsHeading")}
              </h2>

              <JoinRequestCard
                groupId={group.id}
                onCountChange={setPendingCount}
                onActionComplete={async ({ action }) => {
                  if (action === "approve") {
                    try {
                      const refreshed = await groupService.getGroupMembers(group.id);
                      setMembers(refreshed);
                      setMembersFetched(true);
                    } catch (_) {
                      // ignore refresh errors
                    }
                  }
                }}
              />
            </div>
            <GroupPermissionSettings groupId={group.id} />
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}

export const getServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
  },
});
