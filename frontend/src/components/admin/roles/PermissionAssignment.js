import React, { useEffect, useState } from "react";
import { CheckCircle, CheckSquare, PlusCircle } from "lucide-react";
import {
  fetchAllPermissions,
  updateRolePermissions,
  fetchRoleById,
  createPermission,
} from "@/services/admin/roleService";

export default function PermissionAssignment({ role }) {
  const [assignedPermissions, setAssignedPermissions] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPermission, setNewPermission] = useState("");

  useEffect(() => {
    fetchAllPermissions().then(setPermissions);
  }, []);

  useEffect(() => {
    if (role) {
      fetchRoleById(role.id).then((r) => setAssignedPermissions(r.permissions || []));
    }
  }, [role]);

  const handleTogglePermission = (code) => {
    setAssignedPermissions((current) =>
      current.includes(code)
        ? current.filter((p) => p !== code)
        : [...current, code]
    );
  };

  const handleCheckAll = () => {
    setAssignedPermissions((prev) =>
      prev.length === permissions.length
        ? []
        : permissions.map((p) => p.code)
    );
  };

  const handleAddNewPermission = async () => {
    if (newPermission && !permissions.some((p) => p.code === newPermission)) {
      const created = await createPermission({ code: newPermission });
      setPermissions([...permissions, created]);
      setAssignedPermissions([...assignedPermissions, created.code]);
    }
    setNewPermission("");
    setShowAddModal(false);
  };

  const handleSave = async () => {
    const ids = assignedPermissions
      .map((code) => permissions.find((p) => p.code === code)?.id)
      .filter(Boolean);
    await updateRolePermissions(role.id, ids);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
          <CheckCircle className="mr-2 text-yellow-500" />
          Permissions for <span className="ml-2 text-blue-500">{role.name}</span>
        </h3>
        <div className="flex gap-2">
          <button
            className="flex items-center text-sm bg-gray-100 hover:bg-gray-200 rounded-xl py-2 px-4"
            onClick={handleCheckAll}
          >
            <CheckSquare className="w-5 h-5 mr-2 text-blue-500" />
            {assignedPermissions.length === permissions.length ? "Uncheck All" : "Check All"}
          </button>
          <button
            className="flex items-center text-sm bg-yellow-100 hover:bg-yellow-200 rounded-xl py-2 px-4"
            onClick={() => setShowAddModal(true)}
          >
            <PlusCircle className="w-5 h-5 mr-2 text-yellow-600" />
            Add Permission
          </button>
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

      <button
        className="mt-6 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:to-yellow-700 text-white px-6 py-2 rounded-xl shadow transition duration-200"
        onClick={handleSave}
      >
        Save Changes
      </button>

      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add New Permission</h3>
            <input
              value={newPermission}
              onChange={(e) => setNewPermission(e.target.value)}
              placeholder="e.g. manage_users"
              className="w-full border p-2 rounded mb-4"
            />
            <div className="flex justify-end gap-4">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                onClick={handleAddNewPermission}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
