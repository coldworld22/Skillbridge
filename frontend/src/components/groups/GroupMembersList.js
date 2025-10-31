import { useEffect, useState } from "react";
import groupService from "@/services/groupService";
import toast from "react-hot-toast";
import { FaUserSlash, FaUserShield, FaBan } from "react-icons/fa";
import { useTranslation } from "next-i18next";

export default function GroupMembersList({
  groupId,
  currentUserId,
  currentUserRole,
}) {
  const { t } = useTranslation("dashboard");
  const [members, setMembers] = useState([]);

  useEffect(() => {
    groupService.getGroupMembers(groupId).then(setMembers);
  }, [groupId]);

  const handleAction = async (memberId, action) => {
    try {
      const success = await groupService.manageMember(groupId, memberId, action);
      if (!success && action !== "kick") {
        throw new Error("Action failed");
      }

      if (action === "kick") {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      } else {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === memberId
              ? { ...m, ...getUpdatedRoleOrStatus(action) }
              : m,
          ),
        );
      }

      toast.success(actionMessage(action));
    } catch (_) {
      toast.error(t("groupMembersList.errors.update"));
    }
  };

  const actionMessage = (action) => {
    switch (action) {
      case "kick":
        return t("groupMembersList.actions.kick");
      case "promote":
        return t("groupMembersList.actions.promote");
      case "demote":
        return t("groupMembersList.actions.demote");
      case "disable":
        return t("groupMembersList.actions.disable");
      case "enable":
        return t("groupMembersList.actions.enable");
      default:
        return t("groupMembersList.actions.default");
    }
  };

  const resolveRoleLabel = (role) => {
    switch (role) {
      case "admin":
        return t("groupMembersList.labels.admin");
      case "moderator":
        return t("groupMembersList.labels.moderator");
      case "member":
        return t("groupMembersList.labels.member");
      default:
        return role;
    }
  };

  const getUpdatedRoleOrStatus = (action) => {
    switch (action) {
      case "promote":
        return { role: "admin" };
      case "demote":
        return { role: "member" };
      case "disable":
        return { disabled: true };
      case "enable":
        return { disabled: false };
      default:
        return {};
    }
  };

  return (
    <div>
      <h3 className="font-semibold mb-2">
        {t("groupMembersList.title")}
      </h3>
      <ul className="space-y-2">
        {members.map((member) => (
          <li
            key={member.id}
            className="flex items-center justify-between text-sm border-b pb-2"
          >
            <div>
              <strong>{member.name}</strong>
              <span className="text-xs ml-2 text-gray-500">
                ({resolveRoleLabel(member.role)})
              </span>
              {member.disabled && (
                <span className="ml-1 text-red-400">
                  {t("groupMembersList.labels.disabled")}
                </span>
              )}
            </div>
            {member.id !== currentUserId &&
              ["admin", "moderator"].includes(currentUserRole) && (
                <div className="flex gap-2">
                  <button
                    title={t("groupMembersList.tooltips.kick")}
                    onClick={() => handleAction(member.id, "kick")}
                    className="text-red-500 hover:text-red-600"
                  >
                    <FaUserSlash />
                  </button>
                  <button
                    title={
                      member.disabled
                        ? t("groupMembersList.tooltips.enable")
                        : t("groupMembersList.tooltips.disable")
                    }
                    onClick={() =>
                      handleAction(
                        member.id,
                        member.disabled ? "enable" : "disable",
                      )
                    }
                    className="text-red-500 hover:text-red-600"
                  >
                    <FaBan />
                  </button>
                  <button
                    title={
                      member.role === "admin"
                        ? t("groupMembersList.tooltips.demote")
                        : t("groupMembersList.tooltips.promote")
                    }
                    onClick={() =>
                      handleAction(
                        member.id,
                        member.role === "admin" ? "demote" : "promote",
                      )
                    }
                    className="text-blue-500 hover:text-blue-600"
                  >
                    <FaUserShield />
                  </button>
                </div>
              )}
          </li>
        ))}
      </ul>
    </div>
  );
}
