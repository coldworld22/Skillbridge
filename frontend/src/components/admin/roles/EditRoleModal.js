import { useState, useEffect } from "react";

export default function EditRoleModal({ isOpen, onClose, role, onSubmit }) {
  const [form, setForm] = useState({ name: "", description: "" });

  useEffect(() => {
    if (role) setForm({ name: role.name || "", description: role.description || "" });
  }, [role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onSubmit(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Edit Role</h2>
        <input
          type="text"
          name="name"
          placeholder="Role Name"
          value={form.name}
          onChange={handleChange}
          className="w-full border p-2 rounded mb-3"
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="w-full border p-2 rounded mb-4"
        />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
