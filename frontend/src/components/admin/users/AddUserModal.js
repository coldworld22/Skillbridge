import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import modalStyles from "@/components/common/Modal.module.scss";
import { Button } from "@/components/ui/button";

export default function AddUserModal({ isOpen, onClose, onSubmit }) {
  const { t } = useTranslation("dashboard");
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role: "student",
    status: "pending",
    gender: "male",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        password: "",
        role: "student",
        status: "pending",
        gender: "male",
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    if (
      !formData.full_name.trim() ||
      !formData.email.trim() ||
      !formData.password.trim() ||
      !formData.phone.trim()
    ) {
      toast.error(t("fill_required_fields"));
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(formData.email)) {
      toast.error(t("please_enter_valid_email", { ns: "auth" }));
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      toast.success(t("usersPage.user_added"));
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || t("usersPage.user_add_failed"));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className={modalStyles.simpleOverlay}
    >
      <div className={modalStyles.panel} style={{ maxWidth: "28rem" }}>
        <h2 id="modal-title" className={modalStyles.title}>
          {t("usersPage.add_user")}
        </h2>

        <input
          type="text"
          name="full_name"
          placeholder="Full Name"
          value={formData.full_name}
          onChange={handleChange}
          className={modalStyles.input}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className={modalStyles.input}
        />

        <input
          type="text"
          name="phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleChange}
          className={modalStyles.input}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className={modalStyles.input}
        />

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

        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className={modalStyles.input}
        >
          <option value="admin">Admin</option>
          <option value="instructor">Instructor</option>
          <option value="student">Student</option>
        </select>



        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className={modalStyles.input}
        >
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>

        <div className={modalStyles.ctaRow}>
          <Button
            onClick={onClose}
            disabled={loading}
            variant="neutral"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            variant="accent"
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
