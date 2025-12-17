// 📁 components/admin/users/EditUserModal.js

import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { toast } from "react-toastify";
import { updateUserProfile } from "@/services/admin/userService";
import useAuthStore from "@/store/auth/authStore";
import modalStyles from "@/components/common/Modal.module.scss";
import { Button } from "@/components/ui/button";

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
    <Dialog open={isOpen} onClose={onClose} className={modalStyles.dialog}>
      <div className={modalStyles.container}>
        {/* headlessui v2 does not expose a Dialog.Overlay component */}
        <div className={modalStyles.backdrop} aria-hidden="true" />

        <div className={modalStyles.panel} style={{ maxWidth: "28rem", position: "relative" }}>
          <Dialog.Title className={modalStyles.title}>Edit User</Dialog.Title>

          <div className={modalStyles.field} style={{ marginTop: "1rem" }}>
            <input
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Full Name"
              className={modalStyles.input}
            />
          </div>
          <div className={modalStyles.field}>
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              className={modalStyles.input}
            />
          </div>
          <div className={modalStyles.field}>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone"
              className={modalStyles.input}
            />
          </div>
          <div className={modalStyles.field}>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className={modalStyles.input}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>

          <div className={modalStyles.ctaRow}>
            <Button variant="neutral" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="accent" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
