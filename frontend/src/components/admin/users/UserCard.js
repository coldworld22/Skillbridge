import React, { useEffect, useState } from "react";
import { Switch } from "@headlessui/react";
import { toast } from "react-toastify";
import { Edit, Trash2 } from "lucide-react";
import {
  FaUserCircle,
  FaUserShield,
  FaCrown,
  FaChalkboardTeacher,
  FaUserGraduate,
} from "react-icons/fa";
import {
  updateUserStatus,
  updateUserRole,
  deleteUser,
} from "@/services/admin/userService";
import { formatDistanceToNow } from "date-fns";
import styles from "./UserCard.module.scss";
import { Button } from "@/components/ui/button";

export default function UserCard({
  user,
  onEdit,
  onDelete,
  isSelected,
  onSelect,
  canManage = true,
  requirePermission,
  permissionWarning,
  onUserUpdated,
}) {
  const [enabled, setEnabled] = useState((user.status || "").toLowerCase() === "active");
  const [role, setRole] = useState(user.role || "student");

  useEffect(() => {
    setEnabled((user.status || "").toLowerCase() === "active");
    setRole(user.role || "student");
  }, [user.role, user.status]);
  const isSuperAdmin = (user.role || "").toLowerCase() === "superadmin";
  const warning = permissionWarning || "You do not have permission to manage users.";
  const ensureManagePermission = () => {
    if (canManage) return true;
    if (typeof requirePermission === "function") {
      return requirePermission("manage_users", warning);
    }
    toast.error(warning);
    return false;
  };

  const roleColors = {
    admin: styles.admin,
    superadmin: styles.superadmin,
    instructor: styles.instructor,
    student: styles.student,
    default: styles.roleDefault,
  };

  const roleIcons = {
    admin: <FaUserShield className={styles.roleIcon} />,
    superadmin: <FaCrown className={styles.roleIcon} />,
    instructor: <FaChalkboardTeacher className={styles.roleIcon} />,
    student: <FaUserGraduate className={styles.roleIcon} />,
  };
  const roleKey = (role || "").toLowerCase();
  const roleLabel =
    role && typeof role === "string"
      ? role.charAt(0).toUpperCase() + role.slice(1)
      : "—";

  const lastLoginDate = user.lastLogin ? new Date(user.lastLogin) : null;
  const hasLastLogin = lastLoginDate && !Number.isNaN(lastLoginDate.getTime());
  const lastLoginText = hasLastLogin
    ? formatDistanceToNow(lastLoginDate, { addSuffix: true })
    : user.lastLoginDisplay || "—";

  const createdAtDate = user.createdAt ? new Date(user.createdAt) : null;
  const hasCreatedAt = createdAtDate && !Number.isNaN(createdAtDate.getTime());
  const joinedText = hasCreatedAt
    ? formatDistanceToNow(createdAtDate, { addSuffix: true })
    : "—";

  const toggleStatus = async () => {
    if (!ensureManagePermission()) return;
    const newStatus = enabled ? "inactive" : "active";
    if (!window.confirm(`Set ${user.name} as ${newStatus}?`)) return;
    try {
      await updateUserStatus(user.id, newStatus);
      setEnabled(newStatus === "active");
      if (typeof onUserUpdated === "function") {
        onUserUpdated(user.id, { status: newStatus });
      }
      toast.success(`${user.name} is now ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update status");
      console.error("Status error:", err);
    }
  };

  const handleRoleChange = async (e) => {
    if (!ensureManagePermission()) {
      e.preventDefault();
      e.target.value = role;
      return;
    }
    if (isSuperAdmin) return;
    const newRole = e.target.value;
    try {
      await updateUserRole(user.id, newRole);
      setRole(newRole);
      if (typeof onUserUpdated === "function") {
        onUserUpdated(user.id, { role: newRole });
      }
      toast.success(`${user.name}'s role changed to ${newRole}`);
    } catch (err) {
      toast.error("Failed to change role");
      console.error("Role error:", err);
    }
  };

  const handleDelete = async () => {
    if (!ensureManagePermission()) return;
    if (roleKey === "superadmin") {
      toast.error("Cannot delete SuperAdmin user");
      return;
    }
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;
    try {
      await deleteUser(user.id);
      onDelete(user.id);
      toast.success(`${user.name} deleted`);
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to delete user";
      toast.error(message);
      console.error("Delete error:", err);
    }
  };

  const handleEdit = () => {
    if (!ensureManagePermission()) return;
    if (typeof onEdit === "function") {
      onEdit();
    }
  };

  const avatar = user.avatar_url || "/images/profile/default-avatar.png";

  return (
    <div className={styles.card}>
      {roleKey !== "superadmin" && (
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={isSelected}
          onChange={() => {
            if (!ensureManagePermission()) return;
            onSelect(user.id);
          }}
        />
      )}

      <div className={styles.header}>
        <div className={styles.avatarWrap}>
          <img
            src={avatar}
            alt={user.name}
            className={styles.avatarImage}
            onError={(e) => {
              e.currentTarget.src = "/images/profile/default-avatar.png";
            }}
          />
        </div>
        <div>
          <div className={styles.name}>{user.name}</div>
          <div className={styles.email}>{user.email}</div>
        </div>
      </div>

      <div className={styles.roleSection}>
        <span
          className={`${styles.roleBadge} ${roleColors[roleKey] || styles.roleDefault}`}
        >
          {roleIcons[roleKey] ?? <FaUserCircle className={styles.roleIcon} />}
          <span>{roleLabel}</span>
        </span>

        <select
          value={role}
          onChange={handleRoleChange}
          disabled={isSuperAdmin}
          className={styles.select}
        >
          <option value="superadmin" disabled>
            SuperAdmin
          </option>
          <option value="admin">Admin</option>
          <option value="instructor">Instructor</option>
          <option value="student">Student</option>
        </select>
      </div>

      <div className={styles.statusWrap}>
        <div className={styles.switchRow}>
          <Switch
            checked={enabled}
            onChange={toggleStatus}
            className={`${styles.toggle} ${enabled ? styles.toggleActive : ""}`}
          >
            <span className={styles.srOnly}>Toggle Status</span>
            <span className={`${styles.thumb} ${enabled ? styles.thumbActive : ""}`} />
          </Switch>
          <span
            className={`${styles.statusLabel} ${
              enabled ? styles.statusActive : styles.statusInactive
            }`}
          >
            {enabled ? "Active" : "Inactive"}
          </span>
        </div>
        <span className={styles.meta}>Last login: {lastLoginText}</span>
      </div>

      <div className={styles.footer}>
        <span className={styles.meta}>Joined {joinedText}</span>
        <div className={styles.actions}>
          <Button onClick={handleEdit} variant="accent">
            <Edit className={styles.buttonIcon} /> Edit
          </Button>
          {roleKey !== "superadmin" && (
            <Button onClick={handleDelete} variant="danger">
              <Trash2 className={styles.buttonIcon} /> Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
