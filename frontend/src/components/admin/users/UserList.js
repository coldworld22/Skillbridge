import React, { useState } from "react";
import UserCardGrid from "./UserCardGrid";
import UserEditModal from "./EditUserModal";
import UserFilters from "./UserFilters";

import { toast } from "react-toastify";

import { bulkDeleteUsers, bulkUpdateStatus } from "@/services/admin/userService";

export default function UserList({ users, setUsers }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filters, setFilters] = useState({ search: "", role: "", status: "" });
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortBy, setSortBy] = useState("");

  const usersPerPage = 6;
  const totalPages = Math.ceil(users.length / usersPerPage);

  const toggleUserSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const deleteSelected = async () => {
    if (!confirm(`Delete ${selectedIds.length} selected user(s)?`)) return;
    try {
      await bulkDeleteUsers(selectedIds);
      setUsers((prev) => prev.filter((u) => !selectedIds.includes(u.id)));
      setSelectedIds([]);
      toast.success("Selected users deleted");
    } catch (err) {
      console.error("Bulk delete failed", err);
      toast.error("Failed to delete selected users");
    }
  };

  const applyBulkStatus = async (status) => {
    if (!status) return;
    try {
      await bulkUpdateStatus(selectedIds, status);
      setUsers((prev) =>
        prev.map((u) =>
          selectedIds.includes(u.id) ? { ...u, status } : u
        )
      );
      toast.success(`Status set to ${status} for ${selectedIds.length} user(s)`);
    } catch (err) {
      console.error("Bulk status update failed", err);
      toast.error("Failed to update status for selected users");
    }
  };

  const openEditModal = (user) => setSelectedUser(user);
  const closeEditModal = () => setSelectedUser(null);

  const deleteUser = (id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setSelectedIds((prev) => prev.filter((uid) => uid !== id));
  };

  const filteredUsers = users
    .filter((user) =>
      `${user.name} ${user.email || ""}`.toLowerCase().includes(filters.search.toLowerCase())
    )
    .filter((user) =>
      filters.role ? user.role?.toLowerCase() === filters.role.toLowerCase() : true
    )
    .filter((user) =>
      filters.status ? user.status?.toLowerCase() === filters.status.toLowerCase() : true
    );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortBy === "name-asc") return a.name.localeCompare(b.name);
    if (sortBy === "name-desc") return b.name.localeCompare(a.name);
    if (sortBy === "created-asc") return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === "created-desc") return new Date(b.createdAt) - new Date(a.createdAt);
    return 0;
  });

  const currentUsers = sortedUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  return (
    <div>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-gray-800">{users.length}</div>
          <div className="text-sm text-gray-500">Total Users</div>
        </div>
        <div className="p-4 bg-green-100 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-green-800">
            {users.filter((u) => u.status?.toLowerCase() === "active").length}
          </div>
          <div className="text-sm text-green-700">Active</div>
        </div>
        <div className="p-4 bg-red-100 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-red-800">
            {users.filter((u) => u.status?.toLowerCase() === "pending").length}
          </div>
          <div className="text-sm text-red-700">Pending</div>
        </div>
        <div className="p-4 bg-blue-100 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-blue-800">
            {users.filter((u) => u.role?.toLowerCase() === "instructor").length}
          </div>
          <div className="text-sm text-blue-700">Instructors</div>
        </div>
      </div>

      {/* Filters */}
      <UserFilters
        onSearch={(search) => setFilters((f) => ({ ...f, search }))}
        onRoleFilter={(role) => setFilters((f) => ({ ...f, role }))}
        onStatusFilter={(status) => setFilters((f) => ({ ...f, status }))}
        onSortChange={setSortBy}
        selectedCount={selectedIds.length}
        onBulkDelete={deleteSelected}
        onBulkStatusChange={applyBulkStatus}
      />

      {/* Selection Info */}
      {currentUsers.length > 0 && (
        <div className="flex items-center justify-between mb-4 px-1">
          <label className="inline-flex items-center space-x-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={
                selectedIds.length > 0 &&
                currentUsers.every((u) => selectedIds.includes(u.id))
              }
              onChange={(e) => {
                const visibleIds = currentUsers
                  .filter((u) => u.role?.toLowerCase() !== "superadmin")
                  .map((u) => u.id);
                if (e.target.checked) {
                  const combined = Array.from(new Set([...selectedIds, ...visibleIds]));
                  setSelectedIds(combined);
                } else {
                  setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
                }
              }}
              className="accent-blue-500"
            />
            <span>Select All</span>
          </label>
          <span className="text-xs text-gray-500">
            Selected: {selectedIds.length} / {sortedUsers.length}
          </span>
        </div>
      )}

      {/* User Cards */}
      <UserCardGrid
        users={currentUsers}
        onEditUser={openEditModal}
        onDeleteUser={deleteUser}
        selectedIds={selectedIds}
        onSelectUser={toggleUserSelect}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded-md ${
                currentPage === i + 1
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {selectedUser && (
        <UserEditModal
          isOpen={Boolean(selectedUser)}
          user={selectedUser}
          onClose={closeEditModal}
          onUserUpdated={(updated) =>
            setUsers((prev) =>
              prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u))
            )
          }
        />
      )}
    </div>
  );
}
