import React, { useState } from "react";
import { Switch } from "@headlessui/react";
import { toast } from "react-toastify";
import { Edit, Trash2 } from "lucide-react";
import {
  FaUserCircle,
  FaUserShield,
  FaCrown,
  FaChalkboardTeacher,
  FaUserGraduate,
} from "react-icons/fa";
import {
  updateUserStatus,
  updateUserRole,
  deleteUser,
} from "@/services/admin/userService";
import { formatDistanceToNow } from "date-fns";

export default function UserCard({ user, onEdit, onDelete, isSelected, onSelect }) {
  const [enabled, setEnabled] = useState(user.status?.toLowerCase() === "active");
  const [role, setRole] = useState(user.role);

  const roleColors = {
    admin: "bg-yellow-100 text-yellow-700",
    superadmin: "bg-purple-100 text-purple-700",
    instructor: "bg-blue-100 text-blue-700",
    student: "bg-green-100 text-green-700",
    default: "bg-gray-100 text-gray-700",
  };

  const roleIcons = {
    admin: <FaUserShield className="inline-block mr-1" />,
    superadmin: <FaCrown className="inline-block mr-1" />,
    instructor: <FaChalkboardTeacher className="inline-block mr-1" />,
    student: <FaUserGraduate className="inline-block mr-1" />,
  };

  const toggleStatus = async () => {
    const newStatus = enabled ? "inactive" : "active";
    if (!window.confirm(`Set ${user.name} as ${newStatus}?`)) return;
    try {
      await updateUserStatus(user.id, newStatus);
      setEnabled(!enabled);
      toast.success(`${user.name} is now ${newStatus}`);
      alert(`${user.name} is now ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update status");
      console.error("Status error:", err);
    }
  };

  const handleRoleChange = async (e) => {
    const newRole = e.target.value;
    try {
      await updateUserRole(user.id, newRole);
      setRole(newRole);
      toast.success(`${user.name}'s role changed to ${newRole}`);
    } catch (err) {
      toast.error("Failed to change role");
      console.error("Role error:", err);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;
    try {
      await deleteUser(user.id);
      onDelete(user.id);
      toast.success(`${user.name} deleted`);
      alert(`${user.name} deleted`);
    } catch (err) {
      toast.error("Failed to delete user");
      console.error("Delete error:", err);
    }
  };

  const avatar = user.avatar_url || "/images/profile/default-avatar.png";

  return (
    <div className="relative bg-white rounded-xl shadow-md border p-5 flex flex-col justify-between">
      <input
        type="checkbox"
        className="absolute top-3 right-3 w-4 h-4 accent-blue-500"
        checked={isSelected}
        onChange={() => onSelect(user.id)}
      />

      <div className="flex items-center mb-4">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300 bg-white shadow mr-4">
          <img
            src={avatar}
            alt={user.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "/images/profile/default-avatar.png";
            }}
          />
        </div>
        <div>
          <div className="text-base font-semibold text-gray-800">{user.name}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
      </div>

      <div className="mb-3">
        <span
          className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${roleColors[role?.toLowerCase()] || roleColors.default}`}
        >
          {roleIcons[role?.toLowerCase()] ?? <FaUserCircle className="inline-block mr-1" />}
          <span>{role}</span>
        </span>

        <select
          value={role}
          onChange={handleRoleChange}
          className="mt-2 w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
        >
          <option value="admin">Admin</option>
          <option value="instructor">Instructor</option>
          <option value="student">Student</option>
        </select>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Switch
            checked={enabled}
            onChange={toggleStatus}
            className={`${enabled ? "bg-green-500" : "bg-red-400"} relative inline-flex h-6 w-11 items-center rounded-full transition`}
          >
            <span className="sr-only">Toggle Status</span>
            <span
              className={`${enabled ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform bg-white rounded-full transition`}
            />
          </Switch>
          <span
            className={`ml-3 text-xs px-2 py-0.5 rounded-full font-medium ${enabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
          >
            {enabled ? "Active" : "Inactive"}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          Last login:{" "}
          {user.lastLogin
            ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })
            : "—"}
        </span>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onEdit}
          className="flex items-center text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg transition"
        >
          <Edit className="w-4 h-4 mr-1" /> Edit
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition"
        >
          <Trash2 className="w-4 h-4 mr-1" /> Delete
        </button>
      </div>
    </div>
  );
}
