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
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
          <CheckCircle className="mr-2 text-yellow-500" />
          {t("permissionAssignment.heading", { role: role.name })}
        </h3>
        <div className="flex gap-2">
          {canManage && (
            <button
              className="flex items-center text-sm bg-gray-100 hover:bg-gray-200 rounded-xl py-2 px-4"
              onClick={handleCheckAll}
            >
              <CheckSquare className="w-5 h-5 mr-2 text-blue-500" />
              {assignedPermissions.length === permissions.length
                ? t("permissionAssignment.uncheckAll")
                : t("permissionAssignment.checkAll")}
            </button>
          )}
          {canAddPermission && (
            <button
              className="flex items-center text-sm bg-yellow-100 hover:bg-yellow-200 rounded-xl py-2 px-4"
              onClick={() => setShowAddModal(true)}
            >
              <PlusCircle className="w-5 h-5 mr-2 text-yellow-600" />
              {t("permissionAssignment.addPermission")}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {permissions.map((perm) => (
          <label
            key={perm.id || perm.code}
            className={`flex items-center p-3 border rounded-xl cursor-pointer transition ${
              assignedPermissions.includes(perm.code)
                ? "bg-yellow-50 border-yellow-400 text-yellow-700"
                : "hover:bg-gray-50 border-gray-200"
            }`}
          >
            <input
              type="checkbox"
              checked={assignedPermissions.includes(perm.code)}
              onChange={() => handleTogglePermission(perm.code)}
              className="mr-3 accent-yellow-500"
            />
            <span className="capitalize">{perm.code.replace(/_/g, " ")}</span>
          </label>
        ))}
      </div>

      {canManage && (
        <button
          className="mt-6 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:to-yellow-700 text-white px-6 py-2 rounded-xl shadow transition duration-200"
          onClick={handleSave}
        >
          {t("permissionAssignment.save")}
        </button>
      )}

      {showAddModal && canAddPermission && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {t("permissionAssignment.addModal.title")}
            </h3>
            <input
              value={newPermission}
              onChange={(e) => setNewPermission(e.target.value)}
              placeholder={t("permissionAssignment.addModal.placeholder")}
              className="w-full border p-2 rounded mb-4"
            />
            <div className="flex justify-end gap-4">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                onClick={() => setShowAddModal(false)}
              >
                {t("permissionAssignment.addModal.cancel")}
              </button>
              <button
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                onClick={handleAddNewPermission}
              >
                {t("permissionAssignment.addModal.add")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
