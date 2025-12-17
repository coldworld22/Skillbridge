import { useState, useEffect } from "react";
import { useTranslation } from "next-i18next";
import modalStyles from "@/components/common/Modal.module.scss";
import { Button } from "@/components/ui/button";

export default function EditRoleModal({ isOpen, onClose, role, onSubmit }) {
  const [form, setForm] = useState({ name: "", description: "" });
  const { t } = useTranslation("dashboard", { keyPrefix: "rolesPage.modals.edit" });

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
    <div className={modalStyles.simpleOverlay}>
      <div className={modalStyles.panel} style={{ maxWidth: "28rem" }}>
        <h2 className={modalStyles.title}>{t("title")}</h2>
        <input
          type="text"
          name="name"
          placeholder={t("namePlaceholder")}
          value={form.name}
          onChange={handleChange}
          className={modalStyles.input}
        />
        <textarea
          name="description"
          placeholder={t("descriptionPlaceholder")}
          value={form.description}
          onChange={handleChange}
          className={modalStyles.textarea}
        />
        <div className={modalStyles.ctaRow}>
          <Button variant="neutral" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="accent" onClick={handleSubmit}>
            {t("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
