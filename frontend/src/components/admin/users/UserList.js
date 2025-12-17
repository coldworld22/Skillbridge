import React, { useEffect, useState } from "react";
import UserCardGrid from "./UserCardGrid";
import UserEditModal from "./EditUserModal";
import UserFilters from "./UserFilters";
import styles from "./UserList.module.scss";

import { toast } from "react-toastify";

import { bulkDeleteUsers, bulkUpdateStatus } from "@/services/admin/userService";
import usePermission from "@/hooks/usePermission";

export default function UserList({ users, setUsers }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filters, setFilters] = useState({ search: "", role: "", status: "" });
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortBy, setSortBy] = useState("");

  const usersPerPage = 6;

  const { can, requirePermission } = usePermission();
  const canManage = can("manage_users");
  const permissionWarning = "You do not have permission to manage users.";

  useEffect(() => {
    // Reset pagination when the dataset or filters change so we don't land on empty pages.
    setCurrentPage(1);
  }, [filters.search, filters.role, filters.status, sortBy, users.length]);

  useEffect(() => {
    // Remove any selected IDs that no longer exist in the current dataset.
    setSelectedIds((prev) => prev.filter((id) => users.some((u) => u.id === id)));
  }, [users]);

  const toggleUserSelect = (id) => {
    if (!requirePermission("manage_users", permissionWarning)) {
      return;
    }
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const deleteSelected = async () => {
    if (!requirePermission("manage_users", permissionWarning)) {
      return;
    }
    if (!confirm(`Delete ${selectedIds.length} selected user(s)?`)) return;
    try {
      await bulkDeleteUsers(selectedIds);
      setUsers((prev) => prev.filter((u) => !selectedIds.includes(u.id)));
      setSelectedIds([]);
      toast.success("Selected users deleted");
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to delete selected users";
      console.error("Bulk delete failed", err);
      toast.error(message);
    }
  };

  const applyBulkStatus = async (status) => {
    if (!requirePermission("manage_users", permissionWarning)) {
      return;
    }
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

  const openEditModal = (user) => {
    if (!requirePermission("manage_users", permissionWarning)) {
      return;
    }
    setSelectedUser(user);
  };
  const closeEditModal = () => setSelectedUser(null);

  const deleteUser = (id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setSelectedIds((prev) => prev.filter((uid) => uid !== id));
  };

  const updateUserInline = (id, updates) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === id ? { ...user, ...updates } : user))
    );
  };

  const searchTerm = filters.search?.toLowerCase() || "";

  const filteredUsers = users
    .filter((user) =>
      `${user.name || ""} ${user.email || ""}`.toLowerCase().includes(searchTerm)
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

  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);
  const pageToShow = Math.min(currentPage, totalPages || 1);
  const currentUsers = sortedUsers.slice(
    (pageToShow - 1) * usersPerPage,
    pageToShow * usersPerPage
  );

  return (
    <div>
      {/* Summary Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{users.length}</div>
          <div className={styles.statLabel}>Total Users</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {users.filter((u) => u.status?.toLowerCase() === "active").length}
          </div>
          <div className={styles.statLabel}>Active</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {users.filter((u) => u.status?.toLowerCase() === "pending").length}
          </div>
          <div className={styles.statLabel}>Pending</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {users.filter((u) => u.role?.toLowerCase() === "instructor").length}
          </div>
          <div className={styles.statLabel}>Instructors</div>
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
        <div className={styles.selectRow}>
          <label className={styles.selectLabel}>
            <input
              type="checkbox"
              checked={
                selectedIds.length > 0 &&
                currentUsers.every((u) => selectedIds.includes(u.id))
              }
              onChange={(e) => {
                if (!requirePermission("manage_users", permissionWarning)) {
                  e.preventDefault();
                  return;
                }
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
            />
            <span>Select All</span>
          </label>
          <span className={styles.selectCount}>
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
        canManage={canManage}
        requirePermission={requirePermission}
        permissionWarning={permissionWarning}
        onUserUpdated={updateUserInline}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`${styles.pageButton} ${
                pageToShow === i + 1 ? styles.pageActive : ""
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
