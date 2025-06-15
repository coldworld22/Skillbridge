import React, { useState, useEffect } from "react";
import { ShieldCheck, PlusCircle, PenSquare, Trash2 } from "lucide-react";
import PermissionAssignment from "./PermissionAssignment";
import AddRoleModal from "./AddRoleModal";
import EditRoleModal from "./EditRoleModal";
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
  const [showAdd, setShowAdd] = useState(false);
  const [editRole, setEditRole] = useState(null);

  useEffect(() => {
    fetchAllRoles().then((data) => {
      setRoles(data);
      if (data.length) {
        fetchRoleById(data[0].id).then((r) => setSelectedRole(r));
      }
    });
  }, []);

  const handleSelect = async (role) => {
    const detailed = await fetchRoleById(role.id);
    setSelectedRole(detailed);
  };

  const handleAddRole = async (payload) => {
    const newRole = await createRole(payload);
    setRoles((r) => [...r, newRole]);
    setShowAdd(false);
  };

  const handleUpdateRole = async (payload) => {
    const updated = await updateRole(editRole.id, payload);
    setRoles((r) => r.map((ro) => (ro.id === updated.id ? updated : ro)));
    setEditRole(null);
    if (selectedRole?.id === updated.id) setSelectedRole(updated);
  };

  const handleDeleteRole = async (id) => {
    if (!confirm("Delete this role?")) return;
    await deleteRole(id);
    setRoles((r) => r.filter((ro) => ro.id !== id));
    if (selectedRole?.id === id) setSelectedRole(null);
  };

  return (
    <div className="flex space-x-8">
      <div className="w-1/4 bg-white rounded-2xl shadow-md border border-gray-100 p-5">
        <h3 className="font-semibold text-xl flex items-center mb-4 text-gray-800">
          <ShieldCheck className="mr-2 text-yellow-500" /> Roles
        </h3>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center text-sm mb-4 bg-yellow-100 hover:bg-yellow-200 rounded-xl py-2 px-3"
        >
          <PlusCircle className="w-4 h-4 mr-1 text-yellow-600" /> Add Role
        </button>
        <ul className="space-y-2">
          {roles.map((role) => (
            <li
              key={role.id}
              className={`p-3 rounded-xl cursor-pointer transition duration-200$${'{'}
                selectedRole?.id === role.id
                  ? "bg-yellow-500 text-white shadow-md"
                  : "hover:bg-yellow-50 text-gray-700"
              }`}
              onClick={() => handleSelect(role)}
            >
              <div className="flex justify-between items-center">
                <span>{role.name}</span>
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
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="w-3/4 bg-white rounded-2xl shadow-md border border-gray-100 p-5">
        {selectedRole && <PermissionAssignment role={selectedRole} />}
      </div>
      {showAdd && (
        <AddRoleModal
          isOpen={showAdd}
          onClose={() => setShowAdd(false)}
          onSubmit={handleAddRole}
        />
      )}
      {editRole && (
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
