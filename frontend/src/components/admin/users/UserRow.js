import React, { useState } from "react";
import { Switch } from "@headlessui/react";
import { toast } from "react-toastify";
import {
  User,
  Mail,
  BadgeCheck,
  CircleDot,
  Trash2,
  Edit,
  Clock,
} from "lucide-react";
import styles from "./UserRow.module.scss";
import { Button } from "@/components/ui/button";

export default function UserRow({ user, onEdit, onDelete }) {
  const [enabled, setEnabled] = useState(user.status === "Active");
  const [isSaving, setIsSaving] = useState(false);

  const lastLoginDate = user.lastLogin ? new Date(user.lastLogin) : null;
  const lastLoginText =
    lastLoginDate && !Number.isNaN(lastLoginDate.getTime())
      ? lastLoginDate.toLocaleString()
      : user.lastLoginDisplay || "—";

  const toggleStatus = async () => {
    setIsSaving(true);
    setEnabled((prev) => !prev);

    // Simulate API delay
    setTimeout(() => {
      toast.success(`${user.name} is now ${!enabled ? "Active" : "Inactive"}`);
      setIsSaving(false);
    }, 500);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      onDelete(user.id);
      toast.success(`${user.name} deleted`);
    }
  };

  return (
    <tr className={styles.row}>
      {/* NAME */}
      <td className={styles.cell}>
        <div className={styles.name}>
          <User className={styles.iconPrimary} />
          <span>{user.name}</span>
        </div>
      </td>

      {/* EMAIL */}
      <td className={styles.cell}>
        <div className={styles.email}>
          <Mail className={styles.iconMuted} />
          <span>{user.email}</span>
        </div>
      </td>

      {/* ROLE */}
      <td className={styles.cell}>
        <span className={styles.badge}>
          {user.role}
        </span>
      </td>

      {/* STATUS SWITCH */}
      <td className={styles.cell}>
        <div className={styles.statusWrap}>
          <Switch
            checked={enabled}
            onChange={toggleStatus}
            disabled={isSaving}
            className={`${styles.toggle} ${enabled ? styles.toggleActive : ""}`}
          >
            <span className={styles.srOnly}>Toggle Status</span>
            <span
              className={`${styles.thumb} ${enabled ? styles.thumbActive : ""}`}
            />
          </Switch>
          <span
            className={`${styles.statusLabel} ${
              enabled ? styles.statusActive : styles.statusInactive
            }`}
          >
            {enabled ? "Active" : "Inactive"}
          </span>
        </div>
      </td>

      {/* LAST LOGIN */}
      <td className={styles.cell}>
        <div className={styles.name}>
          <Clock className={styles.iconMuted} />
          {lastLoginText}
        </div>
      </td>

      {/* CREATED AT */}
      <td className={styles.cell}>
        {user.createdAt}
      </td>

      {/* ACTION BUTTONS */}
      <td className={`${styles.cell} ${styles.cellRight}`}>
        <div className={styles.actions}>
          <Button onClick={onEdit} variant="accent" className={styles.actionButton}>
            <Edit className={styles.iconMuted} />
            Edit
          </Button>
          <Button onClick={handleDelete} variant="danger" className={styles.actionButton}>
            <Trash2 className={styles.iconMuted} />
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}
