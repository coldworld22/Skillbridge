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
  users = [],
  onEditUser,
  onDeleteUser,
  selectedIds = [],
  onSelectUser,
}) {
  if (!Array.isArray(users)) {
    console.warn("⚠️ `users` is not an array:", users);
    return <div className="text-red-500">Invalid users data</div>;
  }

  if (users.length === 0) {
    return (
      <div className="text-gray-500 text-center w-full py-12">
        No users found.
      </div>
    );
  }

  console.log("✅ Rendering user cards:", users.map(u => u.id));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {users.map((user, idx) => {
        if (!user?.id) {
          console.warn(`⚠️ User at index ${idx} has no ID`, user);
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
          />
        );
      })}
    </div>
  );
}
