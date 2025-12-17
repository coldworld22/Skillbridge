// components/admin/integrations/ChatGPTModal.js
import { useState } from "react";
import { FaTimes, FaSave } from "react-icons/fa";
import { toast } from "react-toastify";
import modalStyles from "@/components/common/Modal.module.scss";
import { Button } from "@/components/ui/button";
import styles from "./Integrations.module.scss";

export default function ChatGPTModal({ initialData = {}, onClose, onSave }) {
  const initModels = initialData.models
    ? initialData.models
    : initialData.model
      ? [{ name: initialData.model, temperature: initialData.temperature ?? 0.7 }]
      : [{ name: "gpt-4", temperature: 0.7 }];

  const [form, setForm] = useState({
    apiKey: initialData.apiKey || "",
    models: initModels,
  });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleModelChange = (index, key, value) => {
    setForm((prev) => {
      const models = [...prev.models];
      models[index] = { ...models[index], [key]: value };
      return { ...prev, models };
    });
  };

  const addModel = () => {
    setForm((prev) => ({
      ...prev,
      models: [...prev.models, { name: "", temperature: 0.7 }],
    }));
  };

  const removeModel = (index) => {
    setForm((prev) => ({
      ...prev,
      models: prev.models.filter((_, i) => i !== index),
    }));
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
          <h2 className={modalStyles.title}>Configure ChatGPT</h2>
          <button onClick={onClose} className={modalStyles.closeButton} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <div className={styles.stack}>
          <div>
            <label className={modalStyles.label}>API Key</label>
            <input
              type="text"
              value={form.apiKey}
              onChange={(e) => handleChange("apiKey", e.target.value)}
              className={modalStyles.input}
              placeholder="sk-..."
            />
          </div>

          <div className={styles.stackSm}>
            <label className={modalStyles.label}>Models</label>
            {form.models.map((m, idx) => (
              <div key={idx} className={modalStyles.inputRow}>
                <input
                  type="text"
                  value={m.name}
                  onChange={(e) => handleModelChange(idx, "name", e.target.value)}
                  placeholder="gpt-4"
                  className={modalStyles.textInput}
                />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={m.temperature}
                  onChange={(e) =>
                    handleModelChange(idx, "temperature", parseFloat(e.target.value))
                  }
                  className={modalStyles.textInput}
                  style={{ width: "5rem" }}
                />
                {form.models.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeModel(idx)}
                    className={modalStyles.closeButton}
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
            <Button type="button" onClick={addModel} variant="ghost">
              Add model
            </Button>
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
