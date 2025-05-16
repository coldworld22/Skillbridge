import React from "react";

export default function UserEditModal({ user, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-8 w-1/3">
        <h2 className="text-xl font-semibold mb-4">Edit User</h2>
        <input
          defaultValue={user.name}
          className="w-full border rounded p-2 mb-4"
          placeholder="Name"
        />
        <input
          defaultValue={user.email}
          className="w-full border rounded p-2 mb-4"
          placeholder="Email"
        />
        <select className="w-full border rounded p-2 mb-4" defaultValue={user.role}>
          <option>Super Admin</option>
          <option>Admin</option>
          <option>Instructor</option>
          <option>Student</option>
        </select>
        <select className="w-full border rounded p-2 mb-6" defaultValue={user.status}>
          <option>Active</option>
          <option>Inactive</option>
        </select>
        <div className="flex justify-end space-x-3">
          <button className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded" onClick={onClose}>
            Cancel
          </button>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
