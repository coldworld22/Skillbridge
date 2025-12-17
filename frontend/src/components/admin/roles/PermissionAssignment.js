import React, { useEffect, useState } from "react";
import { CheckCircle, CheckSquare, PlusCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import usePermission from "@/hooks/usePermission";
import {
  fetchAllPermissions,
  updateRolePermissions,
  fetchRoleById,
  createPermission,
} from "@/services/admin/roleService";
import { useTranslation } from "next-i18next";
import styles from "./Roles.module.scss";
import modalStyles from "@/components/common/Modal.module.scss";
import { Button } from "@/components/ui/button";

export default function PermissionAssignment({ role, canManage }) {
  const [assignedPermissions, setAssignedPermissions] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPermission, setNewPermission] = useState("");
  const { can, requirePermission } = usePermission();
  const canAddPermission = can("manage_permissions");
  const { t } = useTranslation("dashboard", { keyPrefix: "rolesPage" });
  const manageRolesWarning = t("messages.noPermissionUpdatePermissions");
  const managePermissionsWarning = t("messages.noPermissionPermissions");

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const all = await fetchAllPermissions();
        setPermissions(all);
      } catch (err) {
        toast.error(t("messages.permissionsLoadError"));
      }
    };
    loadPermissions();
  }, [t]);

  useEffect(() => {
    if (role) {
      const loadRole = async () => {
        try {
          const r = await fetchRoleById(role.id);
          setAssignedPermissions(r.permissions || []);
        } catch (err) {
          toast.error(t("messages.roleLoadError"));
        }
      };
      loadRole();
    }
  }, [role, t]);

  const handleTogglePermission = (code) => {
    if (!requirePermission("manage_roles", manageRolesWarning)) {
      return;
    }
    setAssignedPermissions((current) =>
      current.includes(code)
        ? current.filter((p) => p !== code)
        : [...current, code]
    );
  };

  const handleCheckAll = () => {
    if (!requirePermission("manage_roles", manageRolesWarning)) {
      return;
    }
    setAssignedPermissions((prev) =>
      prev.length === permissions.length
        ? []
        : permissions.map((p) => p.code)
    );
  };

  const handleAddNewPermission = async () => {
    if (!requirePermission("manage_permissions", managePermissionsWarning)) {
      return;
    }
    if (!newPermission) return;
    if (permissions.some((p) => p.code === newPermission)) {
      toast.error(t("messages.permissionExists"));
      return;
    }
    try {
      const created = await createPermission({ code: newPermission });
      setPermissions([...permissions, created]);
      setAssignedPermissions([...assignedPermissions, created.code]);
      setNewPermission("");
      setShowAddModal(false);
      toast.success(t("messages.permissionCreateSuccess"));
    } catch (err) {
      toast.error(t("messages.permissionCreateError"));
    }
  };

  const handleSave = async () => {
    if (!requirePermission("manage_roles", manageRolesWarning)) {
      return;
    }
    const ids = assignedPermissions
      .map((code) => permissions.find((p) => p.code === code)?.id)
      .filter(Boolean);
    try {
      await updateRolePermissions(role.id, ids);
      toast.success(t("messages.permissionSaveSuccess"));
    } catch (err) {
      toast.error(t("messages.permissionSaveError"));
    }
  };

  return (
    <>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <CheckCircle className={styles.titleIcon} />
          {t("permissionAssignment.heading", { role: role.name })}
        </h3>
        <div className={styles.controls}>
          {canManage && (
            <Button
              variant="secondary"
              className={styles.compactButton}
              onClick={handleCheckAll}
            >
              <CheckSquare className={styles.titleIcon} />
              {assignedPermissions.length === permissions.length
                ? t("permissionAssignment.uncheckAll")
                : t("permissionAssignment.checkAll")}
            </Button>
          )}
          {canAddPermission && (
            <Button
              variant="accent"
              className={styles.compactButton}
              onClick={() => setShowAddModal(true)}
            >
              <PlusCircle className={styles.titleIcon} />
              {t("permissionAssignment.addPermission")}
            </Button>
          )}
        </div>
      </div>

      <div className={styles.assignment}>
        <div className={styles.permissionGrid}>
          {permissions.map((perm) => {
            const isAssigned = assignedPermissions.includes(perm.code);
            return (
              <label
                key={perm.id || perm.code}
                className={`${styles.permissionCard} ${
                  isAssigned ? styles.permissionCardActive : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={isAssigned}
                  onChange={() => handleTogglePermission(perm.code)}
                  className={styles.checkbox}
                />
                <span className={styles.code}>{perm.code.replace(/_/g, " ")}</span>
              </label>
            );
          })}
          {!permissions.length && (
            <div className={styles.emptyState}>
              {t("permissionAssignment.empty", "No permissions configured yet.")}
            </div>
          )}
        </div>

        {canManage && (
          <Button
            variant="accent"
            className={`${styles.compactButton} ${styles.saveButton}`}
            onClick={handleSave}
          >
            {t("permissionAssignment.save")}
          </Button>
        )}
      </div>

      {showAddModal && canAddPermission && (
        <div className={modalStyles.simpleOverlay}>
          <div className={modalStyles.panel}>
            <div className={modalStyles.headerRow}>
              <h3 className={modalStyles.title}>
                {t("permissionAssignment.addModal.title")}
              </h3>
              <button
                className={modalStyles.closeButton}
                aria-label={t("permissionAssignment.addModal.cancel")}
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            <input
              value={newPermission}
              onChange={(e) => setNewPermission(e.target.value)}
              placeholder={t("permissionAssignment.addModal.placeholder")}
              className={modalStyles.input}
            />
            <div className={styles.modalActions}>
              <Button variant="neutral" onClick={() => setShowAddModal(false)}>
                {t("permissionAssignment.addModal.cancel")}
              </Button>
              <Button variant="accent" onClick={handleAddNewPermission}>
                {t("permissionAssignment.addModal.add")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
