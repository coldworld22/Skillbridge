import React, { useState, useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import PermissionAssignment from "./PermissionAssignment";
import { fetchAllRoles, fetchRoleById } from "@/services/admin/roleService";

export default function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);

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

  return (
    <div className="flex space-x-8">
      <div className="w-1/4 bg-white rounded-2xl shadow-md border border-gray-100 p-5">
        <h3 className="font-semibold text-xl flex items-center mb-4 text-gray-800">
          <ShieldCheck className="mr-2 text-yellow-500" /> Roles
        </h3>
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
              {role.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="w-3/4 bg-white rounded-2xl shadow-md border border-gray-100 p-5">
        {selectedRole && <PermissionAssignment role={selectedRole} />}
      </div>
    </div>
  );
}
