import React, { useState } from "react";
import { users as mockUsers } from "@/mocks/usersMock";
import UserCardGrid from "./UserCardGrid";
import UserEditModal from "./UserEditModal";
import UserFilters from "./UserFilters";
import toast from "react-hot-toast";

export default function UserList() {
  const [users, setUsers] = useState(mockUsers);
  const [visibleCount, setVisibleCount] = useState(6);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filters, setFilters] = useState({ search: "", role: "", status: "" });
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortBy, setSortBy] = useState("");

  // Toggle user selection
  const toggleUserSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  // Delete selected users
  const deleteSelected = () => {
    if (confirm(`Delete ${selectedIds.length} selected user(s)?`)) {
      setUsers((prev) => prev.filter((u) => !selectedIds.includes(u.id)));
      setSelectedIds([]);
      toast.success("Selected users deleted");
    }
  };

  // Open and close modal
  const openEditModal = (user) => setSelectedUser(user);
  const closeEditModal = () => setSelectedUser(null);
  const deleteUser = (id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setSelectedIds((prev) => prev.filter((uid) => uid !== id));
  };

  // Filter logic
  const filteredUsers = users
    .filter((user) =>
      `${user.name} ${user.email}`.toLowerCase().includes(filters.search.toLowerCase())
    )
    .filter((user) => (filters.role ? user.role === filters.role : true))
    .filter((user) => (filters.status ? user.status === filters.status : true));

  // Sort logic
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortBy === "name-asc") return a.name.localeCompare(b.name);
    if (sortBy === "name-desc") return b.name.localeCompare(a.name);
    if (sortBy === "created-asc") return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === "created-desc") return new Date(b.createdAt) - new Date(a.createdAt);
    return 0;
  });

  return (
    <div>

      <UserFilters
        onSearch={(search) => setFilters((f) => ({ ...f, search }))}
        onRoleFilter={(role) => setFilters((f) => ({ ...f, role }))}
        onStatusFilter={(status) => setFilters((f) => ({ ...f, status }))}
        onSortChange={setSortBy}
        selectedCount={selectedIds.length}
        onBulkDelete={deleteSelected}
      />
      {sortedUsers.length > 0 && (
  <div className="flex items-center justify-between mb-4 px-1">
    <label className="inline-flex items-center space-x-2 text-sm text-gray-700">
      <input
        type="checkbox"
        checked={
          selectedIds.length > 0 &&
          sortedUsers.slice(0, visibleCount).every((u) => selectedIds.includes(u.id))
        }
        onChange={(e) => {
          const visibleIds = sortedUsers.slice(0, visibleCount).map((u) => u.id);
          if (e.target.checked) {
            // Merge new visible users with already selected
            const combined = Array.from(new Set([...selectedIds, ...visibleIds]));
            setSelectedIds(combined);
          } else {
            // Remove visible users from selection
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


      <UserCardGrid
        users={sortedUsers.slice(0, visibleCount)}
        onEditUser={openEditModal}
        onDeleteUser={deleteUser}
        selectedIds={selectedIds}
        onSelectUser={toggleUserSelect}
      />

      {visibleCount < sortedUsers.length && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setVisibleCount((prev) => prev + 6)}
            className="px-6 py-2 bg-yellow-100 hover:bg-gray-200 text-yellow-700 rounded-md shadow"
          >
            Load More
          </button>
        </div>
      )}

      {selectedUser && (
        <UserEditModal user={selectedUser} onClose={closeEditModal} />
      )}
    </div>
  );
}
