import React, { useState } from "react";
import { roles } from "@/mocks/rolesPermissionsMock";
import PermissionAssignment from "./PermissionAssignment";
import { ShieldCheck } from "lucide-react";

export default function RoleManagement() {
  const [selectedRole, setSelectedRole] = useState(roles[0]);

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
              className={`p-3 rounded-xl cursor-pointer transition duration-200 ${
                selectedRole.id === role.id
                  ? "bg-yellow-500 text-white shadow-md"
                  : "hover:bg-yellow-50 text-gray-700"
              }`}
              onClick={() => setSelectedRole(role)}
            >
              {role.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="w-3/4 bg-white rounded-2xl shadow-md border border-gray-100 p-5">
        <PermissionAssignment role={selectedRole} />
      </div>
    </div>
  );
}
