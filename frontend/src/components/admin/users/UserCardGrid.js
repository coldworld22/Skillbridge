import React from "react";
import UserCard from "./UserCard";

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
  users,
  onEditUser,
  onDeleteUser,
  selectedIds = [],
  onSelectUser,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          onEdit={() => onEditUser(user)}
          onDelete={onDeleteUser}
          isSelected={selectedIds.includes(user.id)}
          onSelect={onSelectUser}
        />
      ))}
    </div>
  );
}
