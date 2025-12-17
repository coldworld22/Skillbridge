import React from "react";
import UserCard from "./UserCard";
import logger from "@/utils/logger";
import styles from "./UserGrid.module.scss";

/**
 * UserCardGrid
 * Props:
 * - users: filtered and sorted user list
 * - onEditUser: function to handle edit
 * - onDeleteUser: function to handle delete
 * - selectedIds: array of selected user IDs
 * - onSelectUser: function to toggle selection (passes userId)
 */
export default function UserCardGrid({
  users = [],
  onEditUser,
  onDeleteUser,
  selectedIds = [],
  onSelectUser,
  canManage = true,
  requirePermission,
  permissionWarning,
  onUserUpdated,
}) {
  if (!Array.isArray(users)) {
    logger.warn("⚠️ `users` is not an array:", users);
    return <div className={styles.empty}>Invalid users data</div>;
  }

  if (users.length === 0) {
    return (
      <div className={styles.empty}>No users found.</div>
    );
  }

  return (
    <div className={styles.grid}>
      {users.map((user, idx) => {
        if (!user?.id) {
          logger.warn(`⚠️ User at index ${idx} has no ID`, user);
          return null;
        }

        return (
          <UserCard
            key={user.id}
            user={user}
            onEdit={() => onEditUser(user)}
            onDelete={onDeleteUser}
            isSelected={selectedIds.includes(user.id)}
            onSelect={onSelectUser}
            canManage={canManage}
            requirePermission={requirePermission}
            permissionWarning={permissionWarning}
            onUserUpdated={onUserUpdated}
          />
        );
      })}
    </div>
  );
}
