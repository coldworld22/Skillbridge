import React from "react";
import styles from "./UserFilters.module.scss";
import { Button } from "@/components/ui/button";

export default function UserFilters({
  onSearch,
  onRoleFilter,
  onStatusFilter,
  onSortChange,
  onBulkDelete,
  onBulkStatusChange,
  selectedCount,
}) {
  const [bulkStatus, setBulkStatus] = React.useState("");
  return (
    <div className={styles.wrapper}>
      {/* Search & Filters */}
      <div className={styles.inputs}>
        <input
          type="text"
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by name or email..."
          className={styles.input}
        />

        <select
          onChange={(e) => onRoleFilter(e.target.value.toLowerCase())}
          className={styles.select}
        >
          <option value="">All Roles</option>
          <option value="superadmin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="instructor">Instructor</option>
          <option value="student">Student</option>
        </select>

        <select
          onChange={(e) => onStatusFilter(e.target.value.toLowerCase())}
          className={styles.select}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Sorting + Bulk Delete */}
      <div className={styles.actions}>
        <select
          onChange={(e) => onSortChange(e.target.value)}
          className={styles.select}
        >
          <option value="">Sort</option>
          <option value="name-asc">Name A → Z</option>
          <option value="name-desc">Name Z → A</option>
          <option value="created-desc">Newest First</option>
          <option value="created-asc">Oldest First</option>
        </select>

        {selectedCount > 0 && (
          <>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className={styles.select}
            >
              <option value="">Set Status...</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
            <Button
              onClick={() => {
                if (!bulkStatus) return;
                onBulkStatusChange(bulkStatus);
                setBulkStatus("");
              }}
              variant="accent"
            >
              Apply
            </Button>
            <Button
              onClick={onBulkDelete}
              variant="danger"
            >
              Delete Selected ({selectedCount})
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
