import React, { useEffect, useState } from "react";
import { permissions, rolePermissions } from "@/mocks/rolesPermissionsMock";
import { CheckCircle, CheckSquare } from "lucide-react";

export default function PermissionAssignment({ role }) {
  const [assignedPermissions, setAssignedPermissions] = useState([]);

  useEffect(() => {
    setAssignedPermissions(rolePermissions[role.id] || []);
  }, [role]);

  const handleTogglePermission = (perm) => {
    setAssignedPermissions((current) =>
      current.includes(perm)
        ? current.filter((p) => p !== perm)
        : [...current, perm]
    );
  };

  const handleCheckAll = () => {
    if (assignedPermissions.length === permissions.length) {
      setAssignedPermissions([]);
    } else {
      setAssignedPermissions(permissions);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
          <CheckCircle className="mr-2 text-yellow-500" />
          Permissions for
          <span className="ml-2 text-blue-500">{role.name}</span>
        </h3>
        <button
          className="flex items-center text-sm bg-gray-100 hover:bg-gray-200 rounded-xl py-2 px-4 transition duration-200"
          onClick={handleCheckAll}
        >
          <CheckSquare className="w-5 h-5 mr-2 text-blue-500" />
          {assignedPermissions.length === permissions.length ? "Uncheck All" : "Check All"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {permissions.map((perm) => (
          <label
            key={perm}
            className={`flex items-center p-3 border rounded-xl cursor-pointer transition duration-150 ${
              assignedPermissions.includes(perm)
                ? "bg-yellow-50 border-yellow-400 text-yellow-700"
                : "hover:bg-gray-50 border-gray-200"
            }`}
          >
            <input
              type="checkbox"
              checked={assignedPermissions.includes(perm)}
              onChange={() => handleTogglePermission(perm)}
              className="mr-3 accent-yellow-500"
            />
            <span className="capitalize">{perm.replace(/_/g, " ")}</span>
          </label>
        ))}
      </div>

      <button className="mt-6 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:to-yellow-700 text-white px-6 py-2 rounded-xl shadow transition duration-200">
        Save Changes
      </button>
    </>
  );
}
