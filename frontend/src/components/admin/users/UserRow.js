import React, { useState } from "react";
import { Switch } from "@headlessui/react";
import toast from "react-hot-toast";
import {
  User,
  Mail,
  BadgeCheck,
  CircleDot,
  Trash2,
  Edit,
  Clock,
} from "lucide-react";

export default function UserRow({ user, onEdit, onDelete }) {
  const [enabled, setEnabled] = useState(user.status === "Active");
  const [isSaving, setIsSaving] = useState(false);

  const toggleStatus = async () => {
    setIsSaving(true);
    setEnabled((prev) => !prev);

    // Simulate API delay
    setTimeout(() => {
      toast.success(`${user.name} is now ${!enabled ? "Active" : "Inactive"}`);
      setIsSaving(false);
    }, 500);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      onDelete(user.id);
      toast.success(`${user.name} deleted`);
    }
  };

  return (
    <tr className="hover:bg-gray-50 transition duration-150">
      {/* NAME */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center">
          <User className="mr-2 text-blue-500" />
          <span className="font-medium text-gray-800">{user.name}</span>
        </div>
      </td>

      {/* EMAIL */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center">
          <Mail className="mr-2 text-gray-500" />
          <span className="text-gray-700">{user.email}</span>
        </div>
      </td>

      {/* ROLE */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
          {user.role}
        </span>
      </td>

      {/* STATUS SWITCH */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center">
          <Switch
            checked={enabled}
            onChange={toggleStatus}
            disabled={isSaving}
            className={`${
              enabled ? "bg-green-500" : "bg-red-400"
            } relative inline-flex h-6 w-11 items-center rounded-full transition`}
          >
            <span className="sr-only">Toggle Status</span>
            <span
              className={`${
                enabled ? "translate-x-6" : "translate-x-1"
              } inline-block h-4 w-4 transform rounded-full bg-white transition`}
            />
          </Switch>
          <span
            className={`ml-2 text-sm font-medium ${
              enabled ? "text-green-700" : "text-red-700"
            }`}
          >
            {enabled ? "Active" : "Inactive"}
          </span>
        </div>
      </td>

      {/* LAST LOGIN */}
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
        <div className="flex items-center">
          <Clock className="mr-2 w-4 h-4 text-gray-400" />
          {user.lastLogin || "—"}
        </div>
      </td>

      {/* CREATED AT */}
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
        {user.createdAt}
      </td>

      {/* ACTION BUTTONS */}
      <td className="px-4 py-3 whitespace-nowrap text-right">
        <div className="flex justify-end space-x-2">
          <button
            onClick={onEdit}
            className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm transition"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm transition"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
