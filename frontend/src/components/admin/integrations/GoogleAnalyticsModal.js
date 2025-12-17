import { useState } from "react";
import { FaSave } from "react-icons/fa";
import { toast } from "react-toastify";
import modalStyles from "@/components/common/Modal.module.scss";
import { Button } from "@/components/ui/button";
import styles from "./Integrations.module.scss";

export default function GoogleAnalyticsModal({ initialData = {}, onClose, onSave }) {
  const [form, setForm] = useState({ measurementId: "", enabled: true, ...initialData });

  const handleSubmit = async () => {
    if (!onSave) return onClose();
    try {
      await onSave(form);
      toast.success("Settings saved");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings");
    }
  };

  return (
    <div className={modalStyles.simpleOverlay}>
      <div className={modalStyles.panel} style={{ maxWidth: "28rem" }}>
        <div className={modalStyles.headerRow}>
          <h2 className={modalStyles.title}>Google Analytics Settings</h2>
          <button
            onClick={onClose}
            className={modalStyles.closeButton}
            aria-label="Close GA settings"
          >
            &times;
          </button>
        </div>

        <div className={styles.stack}>
          <div>
            <label className={modalStyles.label}>GA4 Measurement ID</label>
            <input
              type="text"
              value={form.measurementId}
              onChange={(e) => setForm({ ...form, measurementId: e.target.value })}
              placeholder="e.g., G-XXXXXXX"
              className={modalStyles.input}
            />
          </div>

          <div>
            <label className={modalStyles.label}>Enable Tracking</label>
            <select
              value={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.value === 'true' })}
              className={modalStyles.input}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>

        <div className={modalStyles.ctaRow}>
          <Button onClick={onClose} variant="neutral">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="accent">
            <FaSave className={styles.buttonIcon} /> Save
          </Button>
        </div>
      </div>
    </div>
  );
}
