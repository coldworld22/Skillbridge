import { useState } from "react";
import { FaSave } from "react-icons/fa";
import { toast } from "react-toastify";
import modalStyles from "@/components/common/Modal.module.scss";
import { Button } from "@/components/ui/button";
import styles from "./Integrations.module.scss";

export default function GeminiModal({ initialData = {}, onClose, onSave }) {
  const [form, setForm] = useState({ apiKey: "", model: "gemini-pro", ...initialData });

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
          <h2 className={modalStyles.title}>Gemini (Google AI) Settings</h2>
          <button
            onClick={onClose}
            className={modalStyles.closeButton}
            aria-label="Close Gemini settings"
          >
            &times;
          </button>
        </div>

        <div className={styles.stack}>
          <div>
            <label className={modalStyles.label}>API Key</label>
            <input
              type="text"
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              placeholder="AIzaSy..."
              className={modalStyles.input}
            />
          </div>

          <div>
            <label className={modalStyles.label}>Model</label>
            <select
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className={modalStyles.input}
            >
              <option value="gemini-pro">Gemini Pro</option>
              <option value="gemini-pro-vision">Gemini Pro Vision</option>
              <option value="gemini-ultra">Gemini Ultra</option>
            </select>
          </div>
        </div>

        <div className={modalStyles.ctaRow}>
          <Button onClick={onClose} variant="neutral">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="accent">
            <FaSave /> Save
          </Button>
        </div>
      </div>
    </div>
  );
}
