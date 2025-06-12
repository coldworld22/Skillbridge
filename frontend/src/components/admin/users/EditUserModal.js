// 📁 components/admin/users/EditUserModal.js

import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { toast } from "react-toastify";
import { updateUserProfile } from "@/services/admin/userService";
import useAuthStore from "@/store/auth/authStore";

export default function EditUserModal({ isOpen = false, onClose, user, onUserUpdated }) {
  const { accessToken } = useAuthStore();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    gender: "male",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        gender: user.gender || "male",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await updateUserProfile(user.id, formData, accessToken);
      toast.success("User updated successfully");
      onUserUpdated({ ...user, ...formData });
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update user");
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* headlessui v2 does not expose a Dialog.Overlay component */}
        <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />

        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md z-50 relative">
          <Dialog.Title className="text-lg font-bold mb-4">Edit User</Dialog.Title>

          <div className="space-y-4">
            <input
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full px-3 py-2 border rounded"
            />
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full px-3 py-2 border rounded"
            />
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone"
              className="w-full px-3 py-2 border rounded"
            />
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>

          <div className="flex justify-end mt-6 space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}