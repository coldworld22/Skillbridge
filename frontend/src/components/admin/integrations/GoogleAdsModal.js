import { useState } from "react";
import { FaPlus, FaSave, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import modalStyles from "@/components/common/Modal.module.scss";
import { Button } from "@/components/ui/button";
import styles from "./Integrations.module.scss";

const buildInitialState = (initialData = {}) => {
  const base = {
    conversionId: "",
    remarketingEnabled: true,
    enhancedConversions: {
      enabled: false,
      dataLayerKey: "",
    },
    conversions: [],
  };

  const merged = {
    ...base,
    ...initialData,
    enhancedConversions: {
      ...base.enhancedConversions,
      ...(initialData?.enhancedConversions || {}),
    },
  };

  if (!Array.isArray(merged.conversions)) {
    merged.conversions = [];
  }

  return merged;
};

const makeEmptyConversion = () => ({
  event: "",
  sendTo: "",
  defaultValue: "",
  defaultCurrency: "",
});

export default function GoogleAdsModal({ initialData = {}, onClose, onSave }) {
  const [form, setForm] = useState(() => buildInitialState(initialData));

  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateConversion = (index, patch) => {
    setForm((prev) => {
      const next = Array.isArray(prev.conversions)
        ? [...prev.conversions]
        : [];
      next[index] = { ...next[index], ...patch };
      return { ...prev, conversions: next };
    });
  };

  const addConversion = () => {
    setForm((prev) => ({
      ...prev,
      conversions: [...(prev.conversions || []), makeEmptyConversion()],
    }));
  };

  const removeConversion = (index) => {
    setForm((prev) => {
      const next = [...(prev.conversions || [])];
      next.splice(index, 1);
      return { ...prev, conversions: next };
    });
  };

  const handleSubmit = async () => {
    if (!onSave) return onClose();

    const trimmedConversions = (form.conversions || []).map((conv) => ({
      event: conv.event?.trim() || "",
      sendTo: conv.sendTo?.trim() || "",
      defaultValue: conv.defaultValue ?? "",
      defaultCurrency: conv.defaultCurrency?.trim() || "",
    }));

    const payload = {
      conversionId: form.conversionId?.trim(),
      remarketingEnabled: Boolean(form.remarketingEnabled),
      enhancedConversions: {
        enabled: Boolean(form.enhancedConversions?.enabled),
        dataLayerKey: form.enhancedConversions?.dataLayerKey?.trim() || "",
      },
      conversions: trimmedConversions.filter(
        (conv) => conv.event && conv.sendTo
      ),
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
      <div className={modalStyles.panel} style={{ maxWidth: "48rem", maxHeight: "90vh", overflowY: "auto" }}>
        <div className={modalStyles.headerRow}>
          <h2 className={modalStyles.title}>Google Ads Conversion Tracking</h2>
          <button
            onClick={onClose}
            className={modalStyles.closeButton}
            aria-label="Close Google Ads settings"
          >
            &times;
          </button>
        </div>

        <p className={modalStyles.muted}>
          Configure your Google Ads conversion ID and the conversion events you want
          the platform to track. You can add multiple conversion actions (for example:
          signups, purchases, leads) and map them to <code>send_to</code> values from
          Google Ads.
        </p>

        <div className={styles.stackLg}>
          <div className={styles.gridTwo}>
            <div>
              <label className={modalStyles.label}>
                Google Ads Conversion ID
              </label>
              <input
                type="text"
                value={form.conversionId}
                onChange={(e) => handleChange("conversionId", e.target.value)}
                placeholder="e.g., AW-123456789"
                className={modalStyles.input}
              />
              <p className={modalStyles.mutedSmall}>
                Find this in Google Ads &gt; Tools &amp; Settings &gt; Conversions.
              </p>
            </div>
            <div>
              <label className={modalStyles.label}>
                Enable Remarketing
              </label>
              <select
                value={form.remarketingEnabled ? "true" : "false"}
                onChange={(e) =>
                  handleChange("remarketingEnabled", e.target.value === "true")
                }
                className={modalStyles.input}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
              <p className={modalStyles.mutedSmall}>
                When enabled, the global site tag will emit remarketing signals for Google Ads audiences.
              </p>
            </div>
          </div>

          <div className={modalStyles.confirmBox}>
            <div className={modalStyles.headerRow} style={{ marginBottom: "0.5rem" }}>
              <h3 className={modalStyles.subtitle}>
                Conversion Actions
              </h3>
              <Button
                onClick={addConversion}
                variant="accent"
                size="sm"
              >
                <FaPlus /> Add Conversion
              </Button>
            </div>

            {form.conversions.length === 0 && (
              <p className={modalStyles.mutedSmall}>
                No conversion actions configured yet. Add your first conversion to start tracking events.
              </p>
            )}

            <div className={styles.stack} style={{ marginTop: "1rem" }}>
              {form.conversions.map((conversion, index) => (
                <div
                  key={`conversion-${index}`}
                  className={styles.card}
                >
                  <div className={styles.gridTwo}>
                    <div>
                      <label className={modalStyles.label}>
                        Event Key
                      </label>
                      <input
                        type="text"
                        value={conversion.event}
                        onChange={(e) =>
                          updateConversion(index, { event: e.target.value })
                        }
                        placeholder="e.g., signup"
                        className={modalStyles.input}
                      />
                      <p className={modalStyles.mutedSmall}>
                        Used in code when triggering conversions (example: <code>recordGoogleAdsConversion('signup')</code>).
                      </p>
                    </div>
                    <div>
                      <label className={modalStyles.label}>
                        send_to
                      </label>
                      <input
                        type="text"
                        value={conversion.sendTo}
                        onChange={(e) =>
                          updateConversion(index, { sendTo: e.target.value })
                        }
                        placeholder="e.g., AW-123456789/abcDEF123"
                        className={modalStyles.input}
                      />
                      <p className={modalStyles.mutedSmall}>
                        Copy the specific conversion action&apos;s <code>send_to</code> value from Google Ads.
                      </p>
                    </div>
                    <div>
                      <label className={modalStyles.label}>
                        Default Value (optional)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={conversion.defaultValue ?? ""}
                        onChange={(e) =>
                          updateConversion(index, {
                            defaultValue: e.target.value,
                          })
                        }
                        placeholder="e.g., 49.99"
                        className={modalStyles.input}
                      />
                    </div>
                    <div>
                      <label className={modalStyles.label}>
                        Default Currency (optional)
                      </label>
                      <input
                        type="text"
                        value={conversion.defaultCurrency ?? ""}
                        onChange={(e) =>
                          updateConversion(index, {
                            defaultCurrency: e.target.value,
                          })
                        }
                        placeholder="e.g., USD"
                        className={modalStyles.input}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => removeConversion(index)}
                    className={`${modalStyles.closeButton} ${styles.cardClose}`}
                    aria-label="Remove conversion"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>

            <p className={modalStyles.mutedSmall} style={{ marginTop: "1rem" }}>
              Tip: Map the event keys to platform actions (e.g., <code>signup</code> when a new account is created,
              <code>purchase</code> after a successful payment). The frontend conversion helper will look up the
              matching <code>send_to</code> value automatically.
            </p>
          </div>

          <div className={modalStyles.confirmBox}>
            <h3 className={modalStyles.subtitle} style={{ marginBottom: "0.75rem" }}>
              Enhanced Conversions (optional)
            </h3>
            <div className={styles.gridTwo}>
              <div>
                <label className={modalStyles.label}>
                  Enable Enhanced Conversions
                </label>
                <select
                  value={form.enhancedConversions?.enabled ? "true" : "false"}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      enhancedConversions: {
                        ...prev.enhancedConversions,
                        enabled: e.target.value === "true",
                      },
                    }))
                  }
                  className={modalStyles.input}
                >
                  <option value="false">Disabled</option>
                  <option value="true">Enabled</option>
                </select>
              </div>
              <div>
                <label className={modalStyles.label}>
                  Data Layer Key
                </label>
                <input
                  type="text"
                  value={form.enhancedConversions?.dataLayerKey || ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      enhancedConversions: {
                        ...prev.enhancedConversions,
                        dataLayerKey: e.target.value,
                      },
                    }))
                  }
                  placeholder="e.g., google_enhanced_conversion_data"
                  className={modalStyles.input}
                />
                <p className={modalStyles.mutedSmall}>
                  Optional: name of a dataLayer variable that holds hashed customer data for enhanced conversions.
                </p>
              </div>
            </div>
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
