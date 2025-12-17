import { useEffect, useState } from "react";
import groupService from "@/services/groupService";
import toast from "react-hot-toast";
import { FaUserSlash, FaUserShield, FaBan } from "react-icons/fa";
import { useTranslation } from "next-i18next";
import styles from "./GroupMembersList.module.scss";

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
    <div className={styles.container}>
      <h3 className={styles.title}>
        {t("groupMembersList.title")}
      </h3>
      <ul className={styles.list}>
        {members.map((member) => (
          <li
            key={member.id}
            className={styles.item}
          >
            <div className={styles.userInfo}>
              <strong>{member.name}</strong>
              <span className={styles.role}>
                ({resolveRoleLabel(member.role)})
              </span>
              {member.disabled && (
                <span className={styles.disabled}>
                  {t("groupMembersList.labels.disabled")}
                </span>
              )}
            </div>
            {member.id !== currentUserId &&
              ["admin", "moderator"].includes(currentUserRole) && (
                <div className={styles.actions}>
                  <button
                    title={t("groupMembersList.tooltips.kick")}
                    onClick={() => handleAction(member.id, "kick")}
                    className={`${styles.actionButton} ${styles.danger}`}
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
                    className={`${styles.actionButton} ${styles.warn}`}
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
                    className={`${styles.actionButton} ${styles.primary}`}
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
