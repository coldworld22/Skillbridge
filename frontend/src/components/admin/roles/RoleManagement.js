import React, { useState, useEffect } from "react";
import { ShieldCheck, PlusCircle, PenSquare, Trash2 } from "lucide-react";
import usePermission from "@/hooks/usePermission";
import PermissionAssignment from "./PermissionAssignment";
import AddRoleModal from "./AddRoleModal";
import EditRoleModal from "./EditRoleModal";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  fetchAllRoles,
  fetchRoleById,
  createRole,
  updateRole,
  deleteRole,
} from "@/services/admin/roleService";
import { useTranslation } from "next-i18next";
import styles from "./Roles.module.scss";

export default function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const { can, requirePermission } = usePermission();
  const canManage = can("manage_roles");
  const { t } = useTranslation("dashboard", { keyPrefix: "rolesPage" });
  const manageWarning = t("messages.noPermissionManage");

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const data = await fetchAllRoles();
        setRoles(data);
        if (data.length) {
          const firstRole = await fetchRoleById(data[0].id);
          setSelectedRole(firstRole);
        }
        toast.success(t("messages.loadSuccess"));
      } catch (error) {
        console.error(error);
        toast.error(t("messages.loadError"));
      }
    };
    loadRoles();
  }, [t]);

  const handleSelect = async (role) => {
    const detailed = await fetchRoleById(role.id);
    setSelectedRole(detailed);
  };

  const handleAddRole = async (payload) => {
    if (!requirePermission("manage_roles", manageWarning)) {
      return;
    }
    try {
      const newRole = await createRole(payload);
      setRoles((r) => [...r, newRole]);
      setShowAdd(false);
      toast.success(t("messages.addSuccess"));
    } catch (error) {
      console.error(error);
      toast.error(t("messages.addError"));
    }
  };

  const handleUpdateRole = async (payload) => {
    if (!requirePermission("manage_roles", manageWarning)) {
      return;
    }
    try {
      const updated = await updateRole(editRole.id, payload);
      setRoles((r) => r.map((ro) => (ro.id === updated.id ? updated : ro)));
      setEditRole(null);
      if (selectedRole?.id === updated.id) setSelectedRole(updated);
      toast.success(t("messages.updateSuccess"));
    } catch (error) {
      console.error(error);
      toast.error(t("messages.updateError"));
    }
  };

  const handleDeleteRole = async (id) => {
    if (!requirePermission("manage_roles", manageWarning)) {
      return;
    }
    if (!confirm(t("list.confirmDelete"))) return;
    try {
      await deleteRole(id);
      setRoles((r) => r.filter((ro) => ro.id !== id));
      if (selectedRole?.id === id) setSelectedRole(null);
      toast.success(t("messages.deleteSuccess"));
    } catch (error) {
      console.error(error);
      toast.error(t("messages.deleteError"));
    }
  };

  return (
    <div className={styles.layout}>
      <div className={styles.sidebar}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            <ShieldCheck className={styles.titleIcon} /> {t("list.heading")}
          </h3>
          {canManage && (
            <Button
              variant="accent"
              className={styles.compactButton}
              onClick={() => setShowAdd(true)}
            >
              <PlusCircle className={styles.titleIcon} /> {t("list.add")}
            </Button>
          )}
        </div>
        <ul className={styles.list}>
          {roles.map((role) => (
            <li
              key={role.id}
              className={`${styles.roleItem} ${
                selectedRole?.id === role.id ? styles.roleItemActive : ""
              }`}
              onClick={() => handleSelect(role)}
            >
              <div className={styles.roleHeader}>
                <span className={styles.roleName}>{role.name}</span>
                {canManage && (
                  <span className={styles.roleActions}>
                    <PenSquare
                      className={styles.roleAction}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditRole(role);
                      }}
                    />
                    <Trash2
                      className={`${styles.roleAction} ${styles.roleActionDanger}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRole(role.id);
                      }}
                    />
                  </span>
                )}
              </div>
            </li>
          ))}
          {!roles.length && (
            <li className={styles.emptyState}>{t("list.empty", "No roles yet.")}</li>
          )}
        </ul>
      </div>

      <div className={styles.main}>
        {selectedRole && (
          <PermissionAssignment role={selectedRole} canManage={canManage} />
        )}
      </div>
      {showAdd && canManage && (
        <AddRoleModal
          isOpen={showAdd}
          onClose={() => setShowAdd(false)}
          onSubmit={handleAddRole}
        />
      )}
      {editRole && canManage && (
        <EditRoleModal
          isOpen={Boolean(editRole)}
          role={editRole}
          onClose={() => setEditRole(null)}
          onSubmit={handleUpdateRole}
        />
      )}
    </div>
  );
}
