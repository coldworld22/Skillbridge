import { useMemo, useState } from "react";
import { FaSave } from "react-icons/fa";
import { toast } from "react-toastify";
import modalStyles from "@/components/common/Modal.module.scss";
import { Button } from "@/components/ui/button";
import styles from "./Integrations.module.scss";

const buildInitialForm = (initialData = {}) => {
  const toTextValue = (slots) => {
    if (Array.isArray(slots)) {
      return slots.join("\n");
    }
    if (typeof slots === "string") {
      return slots;
    }
    return "";
  };

  return {
    publisherId: initialData.publisherId || "",
    adSlotsInput: toTextValue(initialData.adSlots),
    autoAds: initialData.autoAds === "disabled" ? "disabled" : "enabled",
  };
};

const parseSlots = (value = "") =>
  value
    .split(/[\n,]+/)
    .map((slot) => slot.trim())
    .filter(Boolean);

export default function GoogleAdSenseModal({ initialData = {}, onClose, onSave }) {
  const [form, setForm] = useState(() => buildInitialForm(initialData));
  const slotsPreview = useMemo(() => parseSlots(form.adSlotsInput), [form.adSlotsInput]);

  const handleSubmit = async () => {
    if (!onSave) return onClose();
    const payload = {
      publisherId: form.publisherId.trim(),
      adSlots: parseSlots(form.adSlotsInput),
      autoAds: form.autoAds === "disabled" ? "disabled" : "enabled",
    };

    try {
      await onSave(payload);
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
          <h2 className={modalStyles.title}>Google AdSense Settings</h2>
          <button
            onClick={onClose}
            className={modalStyles.closeButton}
            aria-label="Close AdSense settings"
          >
            &times;
          </button>
        </div>

        <div className={styles.stack}>
          <div>
            <label className={modalStyles.label}>Publisher ID</label>
            <input
              type="text"
              value={form.publisherId}
              onChange={(e) => setForm({ ...form, publisherId: e.target.value })}
              placeholder="e.g., ca-pub-1234567890123456"
              className={modalStyles.input}
            />
            <p className={modalStyles.mutedSmall}>
              Find the Publisher ID inside AdSense &gt; Account information.
            </p>
          </div>

          <div>
            <label className={modalStyles.label}>Ad Slot IDs</label>
            <textarea
              value={form.adSlotsInput}
              onChange={(e) => setForm({ ...form, adSlotsInput: e.target.value })}
              placeholder="Add one slot ID per line (e.g., 1234567890)"
              className={modalStyles.textarea}
              rows={4}
              style={{ fontFamily: "monospace", fontSize: "0.9rem" }}
            />
            {slotsPreview.length > 0 && (
              <p className={modalStyles.mutedSmall}>
                Will save {slotsPreview.length} slot{slotsPreview.length > 1 ? "s" : ""}.
              </p>
            )}
          </div>

          <div>
            <label className={modalStyles.label}>Auto Ads</label>
            <select
              value={form.autoAds}
              onChange={(e) => setForm({ ...form, autoAds: e.target.value })}
              className={modalStyles.input}
            >
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
            <p className={modalStyles.mutedSmall}>
              Auto ads inject additional placements if allowed in your AdSense account.
            </p>
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
