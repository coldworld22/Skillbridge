// components/admin/integrations/DeepSeekModal.js
import { useState } from "react";
import { FaTimes, FaSave } from "react-icons/fa";
import { toast } from "react-toastify";
import modalStyles from "@/components/common/Modal.module.scss";
import { Button } from "@/components/ui/button";

export default function DeepSeekModal({ initialData = {}, onClose, onSave }) {
  const [form, setForm] = useState({
    apiKey: "",
    model: "deepseek-chat",
    maxTokens: 1024,
    ...initialData,
  });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

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
      <div className={modalStyles.panel} style={{ maxWidth: "30rem" }}>
        <div className={modalStyles.headerRow}>
          <h2 className={modalStyles.title}>Configure DeepSeek</h2>
          <button onClick={onClose} className={modalStyles.closeButton} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <div className={modalStyles.field}>
          <label className={modalStyles.mutedSmall}>API Key</label>
          <input
            type="text"
            value={form.apiKey}
            onChange={(e) => handleChange("apiKey", e.target.value)}
            className={modalStyles.input}
            placeholder="your-deepseek-key"
          />
        </div>

        <div className={modalStyles.field}>
          <label className={modalStyles.mutedSmall}>Model</label>
          <input
            type="text"
            value={form.model}
            onChange={(e) => handleChange("model", e.target.value)}
            className={modalStyles.input}
            placeholder="deepseek-chat"
          />
        </div>

        <div className={modalStyles.field}>
          <label className={modalStyles.mutedSmall}>Max Tokens</label>
          <input
            type="number"
            value={form.maxTokens}
            onChange={(e) => handleChange("maxTokens", parseInt(e.target.value))}
            className={modalStyles.input}
          />
        </div>

        <div className={modalStyles.ctaRow}>
          <Button variant="neutral" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" onClick={handleSubmit}>
            <FaSave /> Save
          </Button>
        </div>
      </div>
    </div>
  );
}
