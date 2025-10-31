import React, { useState, useEffect } from "react";
import { ShieldCheck, PlusCircle, PenSquare, Trash2 } from "lucide-react";
import usePermission from "@/hooks/usePermission";
import PermissionAssignment from "./PermissionAssignment";
import AddRoleModal from "./AddRoleModal";
import EditRoleModal from "./EditRoleModal";
import { toast } from "react-hot-toast";
import {
  fetchAllRoles,
  fetchRoleById,
  createRole,
  updateRole,
  deleteRole,
} from "@/services/admin/roleService";
import { useTranslation } from "next-i18next";

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
    <div className="flex space-x-8">
      <div className="w-1/4 bg-white rounded-2xl shadow-md border border-gray-100 p-5">
        <h3 className="font-semibold text-xl flex items-center mb-4 text-gray-800">
          <ShieldCheck className="mr-2 text-yellow-500" /> {t("list.heading")}
        </h3>
        {canManage && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center text-sm mb-4 bg-yellow-100 hover:bg-yellow-200 rounded-xl py-2 px-3"
          >
            <PlusCircle className="w-4 h-4 mr-1 text-yellow-600" /> {t("list.add")}
          </button>
        )}
        <ul className="space-y-2">
          {roles.map((role) => (
            <li
              key={role.id}
              className={`p-3 rounded-xl cursor-pointer transition duration-200 ${
                selectedRole?.id === role.id
                  ? "bg-yellow-500 text-white shadow-md"
                  : "hover:bg-yellow-50 text-gray-700"
              }`}
              onClick={() => handleSelect(role)}
            >
              <div className="flex justify-between items-center">
                <span>{role.name}</span>
                {canManage && (
                  <span className="flex gap-1">
                    <PenSquare
                      className="w-4 h-4 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditRole(role);
                      }}
                    />
                    <Trash2
                      className="w-4 h-4 cursor-pointer text-red-600"
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
        </ul>
      </div>

      <div className="w-3/4 bg-white rounded-2xl shadow-md border border-gray-100 p-5">
        {selectedRole && <PermissionAssignment role={selectedRole} canManage={canManage} />}
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
