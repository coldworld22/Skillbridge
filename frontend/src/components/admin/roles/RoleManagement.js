import React, { useState, useEffect, useRef } from "react";
import { ShieldCheck, PlusCircle, PenSquare, Trash2 } from "lucide-react";
import useAuthStore from "@/store/auth/authStore";
import PermissionAssignment from "./PermissionAssignment";
import AddRoleModal from "./AddRoleModal";
import EditRoleModal from "./EditRoleModal";
import { toast } from "react-toastify";
import {
  fetchAllRoles,
  fetchRoleById,
  createRole,
  updateRole,
  deleteRole,
} from "@/services/admin/roleService";

export default function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isRoleLoading, setIsRoleLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const { user } = useAuthStore();
  const canManage = user?.permissions?.includes("manage_roles");
  const latestRequestedRoleId = useRef(null);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const data = await fetchAllRoles();
        setRoles(data);
        if (data.length) {
          const firstRoleId = data[0].id;
          latestRequestedRoleId.current = firstRoleId;
          setIsRoleLoading(true);
          try {
            const firstRole = await fetchRoleById(firstRoleId);
            if (latestRequestedRoleId.current === firstRoleId) {
              setSelectedRole(firstRole);
            }
          } catch (error) {
            console.error(error);
            toast.error("Failed to load role details");
          } finally {
            if (latestRequestedRoleId.current === firstRoleId) {
              setIsRoleLoading(false);
            }
          }
        }
        toast.success("Roles loaded");
      } catch (error) {
        console.error(error);
        toast.error("Failed to load roles");
      }
    };
    loadRoles();
  }, []);

  const handleSelect = async (role) => {
    const previousRole = selectedRole;
    try {
      const detailed = await fetchRoleById(role.id);
      setSelectedRole(detailed);
    } catch (error) {
      console.error(error);
      setSelectedRole(previousRole);
      toast.error("Failed to load role details");
    }
  };

  const handleAddRole = async (payload) => {
    if (!canManage) return;
    try {
      const newRole = await createRole(payload);
      setRoles((r) => [...r, newRole]);
      setShowAdd(false);
      toast.success("Role added");
    } catch (error) {
      console.error(error);
      toast.error("Failed to add role");
    }
  };

  const handleUpdateRole = async (payload) => {
    if (!canManage) return;
    try {
      const updated = await updateRole(editRole.id, payload);
      setRoles((r) => r.map((ro) => (ro.id === updated.id ? updated : ro)));
      setEditRole(null);
      if (selectedRole?.id === updated.id) setSelectedRole(updated);
      toast.success("Role updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update role");
    }
  };

  const handleDeleteRole = async (id) => {
    if (!canManage || !confirm("Delete this role?")) return;
    try {
      await deleteRole(id);
      setRoles((r) => r.filter((ro) => ro.id !== id));
      if (selectedRole?.id === id) setSelectedRole(null);
      toast.success("Role deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete role");
    }
  };

  const handleRolePermissionsUpdated = (updatedRole) => {
    if (!updatedRole) return;
    setRoles((prev) =>
      prev.map((role) => (role.id === updatedRole.id ? { ...role, ...updatedRole } : role))
    );
    if (selectedRole?.id === updatedRole.id) {
      setSelectedRole(updatedRole);
    }
  };

  return (
    <div className="flex space-x-8">
      <div className="w-1/4 bg-white rounded-2xl shadow-md border border-gray-100 p-5">
        <h3 className="font-semibold text-xl flex items-center mb-4 text-gray-800">
          <ShieldCheck className="mr-2 text-yellow-500" /> Roles
        </h3>
        {canManage && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center text-sm mb-4 bg-yellow-100 hover:bg-yellow-200 rounded-xl py-2 px-3"
          >
            <PlusCircle className="w-4 h-4 mr-1 text-yellow-600" /> Add Role
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
        {selectedRole && (
          <PermissionAssignment
            role={selectedRole}
            canManage={canManage}
            onRolePermissionsUpdated={handleRolePermissionsUpdated}
          />
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
