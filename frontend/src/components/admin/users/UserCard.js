import React, { useState } from "react";
import { Switch } from "@headlessui/react";
import toast from "react-hot-toast";
import { Edit, Trash2 } from "lucide-react";

/**
 * UserCard Component
 * Props:
 * - user: user data object
 * - onEdit: function to open edit modal
 * - onDelete: function to delete user
 * - isSelected: boolean (if selected for bulk)
 * - onSelect: function to toggle selection
 */
export default function UserCard({ user, onEdit, onDelete, isSelected, onSelect }) {
  const [enabled, setEnabled] = useState(user.status === "Active");

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const toggleStatus = () => {
    setEnabled(!enabled);
    toast.success(`${user.name} is now ${!enabled ? "Active" : "Inactive"}`);
  };

  return (
    <div className="relative bg-white rounded-xl shadow-md border p-5 flex flex-col justify-between">
      {/* Select Checkbox */}
      <input
        type="checkbox"
        className="absolute top-3 right-3 w-4 h-4 accent-blue-500"
        checked={isSelected}
        onChange={() => onSelect(user.id)}
      />

      {/* Avatar + Info */}
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 mr-4 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="object-cover w-full h-full"
            />
          ) : (
            initials
          )}
        </div>
        <div>
          <div className="text-base font-semibold text-gray-800">{user.name}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
      </div>

      {/* Role Badge */}
      <div className="mb-3">
        <span className="inline-block px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full">
          {user.role}
        </span>
      </div>

      {/* Status Switch + Last Login */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Switch
            checked={enabled}
            onChange={toggleStatus}
            className={`${
              enabled ? "bg-green-500" : "bg-red-400"
            } relative inline-flex h-6 w-11 items-center rounded-full transition`}
          >
            <span className="sr-only">Toggle Status</span>
            <span
              className={`${
                enabled ? "translate-x-6" : "translate-x-1"
              } inline-block h-4 w-4 transform bg-white rounded-full transition`}
            />
          </Switch>
          <span
            className={`ml-3 text-sm font-medium ${
              enabled ? "text-green-700" : "text-red-700"
            }`}
          >
            {enabled ? "Active" : "Inactive"}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          Last login: {user.lastLogin || "—"}
        </span>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={onEdit}
          className="flex items-center text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg transition"
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </button>
        <button
          onClick={() => {
            if (confirm(`Are you sure you want to delete ${user.name}?`)) {
              onDelete(user.id);
              toast.success(`${user.name} deleted`);
            }
          }}
          className="flex items-center text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </button>
      </div>
    </div>
  );
}
