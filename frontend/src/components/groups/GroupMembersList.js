import { useEffect, useState } from "react";
import groupService from "@/services/groupService";
import toast from "react-hot-toast";
import { FaUserSlash, FaVolumeMute, FaUserShield, FaBan } from "react-icons/fa";

export default function GroupMembersList({
  groupId,
  currentUserId,
  currentUserRole,
}) {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    groupService.getGroupMembers(groupId).then(setMembers);
  }, [groupId]);

  const handleAction = async (memberId, action) => {
    try {
      const success = await groupService.manageMember(groupId, memberId, action);
      if (success) {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === memberId
              ? { ...m, ...getUpdatedRoleOrStatus(m, action) }
              : m,
          ),
        );

        toast.success(actionMessage(action));
      }
    } catch (_) {
      toast.error("Failed to update member");
    }
  };

  const actionMessage = (action) => {
    switch (action) {
      case "kick":
        return "Member removed";
      case "mute":
        return "Member muted";
      case "unmute":
        return "Member unmuted";
      case "promote":
        return "Member promoted";
      case "demote":
        return "Member demoted";
      case "disable":
        return "Member disabled";
      case "enable":
        return "Member enabled";
      default:
        return "Action completed";
    }
  };

  const getUpdatedRoleOrStatus = (member, action) => {
    switch (action) {
      case "kick":
        return { removed: true };
      case "mute":
        return { muted: true };
      case "unmute":
        return { muted: false };
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
      <h3 className="font-semibold mb-2">👥 Group Members</h3>
      <ul className="space-y-2">
        {members
          .filter((m) => !m.removed)
          .map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between text-sm border-b pb-2"
            >
              <div>
                <strong>{member.name}</strong>
                <span className="text-xs ml-2 text-gray-500">
                  ({member.role})
                </span>
                {member.muted && (
                  <span className="ml-1 text-red-400">[Muted]</span>
                )}
                {member.disabled && (
                  <span className="ml-1 text-red-400">[Disabled]</span>
                )}
              </div>
              {member.id !== currentUserId &&
                ["admin", "moderator"].includes(currentUserRole) && (
                  <div className="flex gap-2">
                    <button
                      title="Kick"
                      onClick={() => handleAction(member.id, "kick")}
                      className="text-red-500 hover:text-red-600"
                    >
                      <FaUserSlash />
                    </button>
                    <button
                      title={member.disabled ? "Enable" : "Disable"}
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
                      title={member.muted ? "Unmute" : "Mute"}
                      onClick={() =>
                        handleAction(
                          member.id,
                          member.muted ? "unmute" : "mute",
                        )
                      }
                      className="text-yellow-500 hover:text-yellow-600"
                    >
                      <FaVolumeMute />
                    </button>
                    <button
                      title={
                        member.role === "admin"
                          ? "Demote to Member"
                          : "Make Admin"
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
